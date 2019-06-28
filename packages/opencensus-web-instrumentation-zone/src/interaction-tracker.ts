/**
 * Copyright 2019, OpenCensus Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  randomTraceId,
  tracing,
  SpanKind,
  RootSpan,
} from '@opencensus/web-core';
import { AsyncTask } from './zone-types';
import {
  OnPageInteractionStopwatch,
  startOnPageInteraction,
} from './on-page-interaction';

// Allows us to monkey patch Zone prototype without TS compiler errors.
declare const Zone: ZoneType & { prototype: Zone };

// Delay of 50 ms to reset currentEventTracingZone.
export const RESET_TRACING_ZONE_DELAY = 50;

export class InteractionTracker {
  // Allows to track several events triggered by the same user interaction in the right Zone.
  private currentEventTracingZone?: Zone;

  // Used to reset the currentEventTracingZone when the interaction
  // finishes before it is reset automatically.
  private currentResetTracingZoneTimeout?: number;

  // Map of interaction Ids to stopwatches.
  private readonly interactions: {
    [index: string]: OnPageInteractionStopwatch;
  } = {};

  // Map of interaction Ids to timeout ids.
  private readonly interactionCompletionTimeouts: {
    [index: string]: number;
  } = {};

  private static singletonInstance: InteractionTracker;

  private constructor() {
    this.patchZoneRunTask();
    this.patchZoneScheduleTask();
    this.patchZoneCancelTask();
    this.patchHistoryApi();
  }

  static startTracking(): InteractionTracker {
    return this.singletonInstance || (this.singletonInstance = new this());
  }

  private patchZoneRunTask() {
    const runTask = Zone.prototype.runTask;
    Zone.prototype.runTask = (
      task: AsyncTask,
      applyThis: unknown,
      applyArgs: unknown
    ) => {
      const interceptingElement = getTrackedElement(task);
      const interactionName = resolveInteractionName(
        interceptingElement,
        task.eventName
      );
      if (interceptingElement) {
        if (this.currentEventTracingZone === undefined && interactionName) {
          // Starts the new zone from the Zone.current, for that, we assume
          // all click handlers have the same parent zone.
          this.startNewInteraction(
            interceptingElement,
            task.eventName,
            task.zone,
            interactionName
          );
        }
        if (this.currentEventTracingZone) {
          task._zone = this.currentEventTracingZone;
        }
        this.incrementTaskCount(getTraceId(task.zone));
      }
      try {
        return runTask.call(task.zone as {}, task, applyThis, applyArgs);
      } finally {
        if (
          interceptingElement ||
          (shouldCountTask(task) && isTrackedTask(task))
        ) {
          this.decrementTaskCount(getTraceId(task.zone));
        }
      }
    };
  }

  private patchZoneScheduleTask() {
    const scheduleTask = Zone.prototype.scheduleTask;
    Zone.prototype.scheduleTask = <T extends Task>(task: T) => {
      let taskZone = Zone.current;
      if (isTrackedTask(task)) {
        taskZone = task.zone;
      }
      try {
        return scheduleTask.call(taskZone as {}, task) as T;
      } finally {
        if (shouldCountTask(task) && isTrackedTask(task)) {
          this.incrementTaskCount(getTraceId(task.zone));
        }
      }
    };
  }

  private patchZoneCancelTask() {
    const cancelTask = Zone.prototype.cancelTask;
    Zone.prototype.cancelTask = (task: AsyncTask) => {
      let taskZone = Zone.current;
      if (isTrackedTask(task)) {
        taskZone = task.zone;
      }

      try {
        return cancelTask.call(taskZone as {}, task);
      } finally {
        if (isTrackedTask(task) && shouldCountTask(task)) {
          this.decrementTaskCount(getTraceId(task.zone));
        }
      }
    };
  }

  private startNewInteraction(
    interceptingElement: HTMLElement,
    eventName: string,
    taskZone: Zone,
    interactionName: string
  ) {
    const traceId = randomTraceId();
    const spanOptions = {
      name: interactionName,
      spanContext: {
        traceId,
        // This becomes the parentSpanId field of the root span, and the actual
        // span ID for the root span gets assigned to a random number.
        spanId: '',
      },
      kind: SpanKind.UNSPECIFIED,
    };
    // Start a new RootSpan for a new user interaction forked from the original task.zone
    taskZone.run(() => {
      tracing.tracer.startRootSpan(spanOptions, root => {
        // As startRootSpan creates the zone and Zone.current corresponds to the
        // new zone, we have to set the currentEventTracingZone with the Zone.current
        // to capture the new zone, also, start the `OnPageInteraction` to capture the
        // new root span.
        this.currentEventTracingZone = Zone.current;
        this.interactions[traceId] = startOnPageInteraction({
          startLocationHref: location.href,
          startLocationPath: location.pathname,
          eventType: eventName,
          target: interceptingElement,
          rootSpan: root as RootSpan,
        });
      });
    });

    // Timeout to reset currentEventTracingZone to allow the creation of a new
    // zone for a new user interaction.
    Zone.root.run(() => {
      // Store the timeout in case the interaction finishes before
      // this callback runs.
      this.currentResetTracingZoneTimeout = window.setTimeout(
        () => this.resetCurrentTracingZone(),
        RESET_TRACING_ZONE_DELAY
      );
    });
  }

  private resetCurrentTracingZone() {
    this.currentEventTracingZone = undefined;
    this.currentResetTracingZoneTimeout = undefined;
  }

  /** Increments the count of outstanding tasks for a given interaction id. */
  private incrementTaskCount(interactionId: string) {
    const stopWatch = this.getStopwatch(interactionId);
    if (!stopWatch) return;
    stopWatch.incrementTaskCount();

    if (interactionId in this.interactionCompletionTimeouts) {
      // Clear the task that is supposed to complete the interaction as there are new
      // tasks incrementing the task cout. Sometimes the task count might be 0
      // but the interaction has more scheduled tasks.
      Zone.root.run(() => {
        clearTimeout(this.interactionCompletionTimeouts[interactionId]);
        delete this.interactionCompletionTimeouts[interactionId];
      });
    }
  }

  /** Decrements the count of outstanding tasks for a given interaction id. */
  private decrementTaskCount(interactionId: string) {
    const stopWatch = this.getStopwatch(interactionId);
    if (!stopWatch) return;
    stopWatch.decrementTaskCount();

    if (!stopWatch.hasRemainingTasks()) {
      this.maybeCompleteInteraction(interactionId);
    }
  }

  private getStopwatch(
    interactionId: string
  ): OnPageInteractionStopwatch | undefined {
    if (!(interactionId in this.interactions)) return;
    return this.interactions[interactionId];
  }

  /**
   * Instead of declaring an interaction to be complete when the number of
   * active interactions reaches 0 we add a task to the queue that will actually
   * complete the interaction if none of the tasks scheduled ahead of it try
   * and increment the task counter for the given interaction id.
   */
  private maybeCompleteInteraction(interactionId: string) {
    const stopWatch = this.getStopwatch(interactionId);
    if (!stopWatch) return;

    if (this.interactionCompletionTimeouts[interactionId] !== undefined) return;

    // Add a task to the queue that will actually complete the interaction in case
    // there are no more scheduled tasks ahead it.
    Zone.root.run(() => {
      this.interactionCompletionTimeouts[interactionId] = setTimeout(() => {
        this.completeInteraction(interactionId);
        delete this.interactionCompletionTimeouts[interactionId];
        // In case the interaction finished beforeresetCurrentTracingZone is called,
        // this in order to allow the creating of a new interaction.
        if (this.currentResetTracingZoneTimeout) {
          Zone.root.run(() => {
            clearTimeout(this.currentResetTracingZoneTimeout);
            this.resetCurrentTracingZone();
          });
        }
      });
    });
  }

  private completeInteraction(interactionId: string) {
    const stopWatch = this.getStopwatch(interactionId);
    if (!stopWatch) return;
    stopWatch.stopAndRecord();
    delete this.interactions[interactionId];
  }

  // Monkey-patch `History API` to detect route transitions.
  // This is necessary because there might be some cases when
  // there are several interactions being tracked at the same time
  // but if there is an user interaction that triggers a route transition
  // while those interactions are still in tracking, only that interaction
  // will have a `Navigation` name. Otherwise, if this is not patched, the
  // other interactions will change the name to `Navigation` even if they
  // did not cause the route transition.
  private patchHistoryApi() {
    const pushState = history.pushState;
    history.pushState = (
      data: unknown,
      title: string,
      url?: string | null | undefined
    ) => {
      patchHistoryApiMethod(pushState, data, title, url);
    };

    const replaceState = history.replaceState;
    history.replaceState = (
      data: unknown,
      title: string,
      url?: string | null | undefined
    ) => {
      patchHistoryApiMethod(replaceState, data, title, url);
    };

    const back = history.back;
    history.back = () => {
      patchHistoryApiMethod(back);
    };

    const forward = history.forward;
    history.forward = () => {
      patchHistoryApiMethod(forward);
    };

    const go = history.go;
    history.go = (delta?: number) => {
      patchHistoryApiMethod(go, delta);
    };

    const patchHistoryApiMethod = (func: Function, ...args: unknown[]) => {
      // Store the location.pathname before it changes calling `func`.
      const currentPathname = location.pathname;
      func.call(history, ...args);
      this.maybeUpdateInteractionName(currentPathname);
    };
  }

  private maybeUpdateInteractionName(previousLocationPathname: string) {
    const rootSpan = tracing.tracer.currentRootSpan;
    // If for this interaction, the developer did not give any
    // explicit attibute (`data-ocweb-id`) the current interaction
    // name will start with a '<' that stands to the tag name. If that is
    // the case, change the name to `Navigation <pathname>` as this is a more
    // understadable name for the interaction.
    // Also, we check if the location pathname did change.
    if (
      rootSpan &&
      rootSpan.name.startsWith('<') &&
      previousLocationPathname !== location.pathname
    ) {
      rootSpan.name = 'Navigation ' + location.pathname;
    }
  }
}

/**
 * Get the trace ID from the zone properties.
 * @param zone
 */
function getTraceId(zone: Zone): string {
  return zone && zone.get('data') ? zone.get('data').traceId : '';
}

function getTrackedElement(task: AsyncTask): HTMLElement | null {
  if (!(task.eventName && task.eventName === 'click')) return null;

  return task.target as HTMLElement;
}

/**
 * Whether or not a task is being tracked as part of an interaction.
 */
function isTrackedTask(task: Task): boolean {
  return !!(
    task.zone &&
    task.zone.get('data') &&
    task.zone.get('data').isTracingZone
  );
}
/**
 * Look for 'data-ocweb-id' attibute in the HTMLElement in order to
 * give a name to the user interaction and Root span. If this attibute is
 * not present, use the element ID, tag name, event that triggered the interaction.
 * Thus, the resulting interaction name will be: "tag_name> id:'ID' event"
 * (e.g. "<BUTTON> id:'save_changes' click").
 * In case the the name is not resolvable, return empty string (e.g. element is the document).
 * @param element
 */
function resolveInteractionName(
  element: HTMLElement | null,
  eventName: string
): string {
  if (!element) return '';
  if (!element.getAttribute) return '';
  if (element.hasAttribute('disabled')) {
    return '';
  }
  let interactionName = element.getAttribute('data-ocweb-id');
  if (!interactionName) {
    const elementId = element.getAttribute('id') || '';
    const tagName = element.tagName;
    if (!tagName) return '';
    interactionName =
      '<' +
      tagName +
      '>' +
      (elementId ? " id:'" + elementId + "' " : '') +
      eventName;
  }
  return interactionName;
}

/**
 * Whether or not a task should be tracked as part of an interaction.
 */
function shouldCountTask(task: Task): boolean {
  if (!task.data) return false;

  // Don't count periodic tasks like setInterval as they will be repeatedly
  // called. This will cause that the interaction never finishes, then would be
  // imposible to measure the stability of the interaction.
  // This case only applies for `setInterval` as we support `setTimeout`.
  // TODO: ideally OpenCensus Web can manage this kind of tasks, so for example
  // if a periodic task ends up doing some work in the future it will still
  // be associated with that same older tracing zone. This is something we have to
  // think of.
  if (task.data.isPeriodic) return false;

  // We're only interested in macroTasks and microTasks.
  return task.type === 'macroTask' || task.type === 'microTask';
}
