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
  Propagation,
} from '@opencensus/web-core';
import { AsyncTask, InteractionName } from './zone-types';
import {
  OnPageInteractionStopwatch,
  startOnPageInteraction,
} from './on-page-interaction-stop-watch';

import { isTracingZone, getTraceId, resolveInteractionName } from './util';
import { interceptXhrTask } from './xhr-interceptor';

// Allows us to monkey patch Zone prototype without TS compiler errors.
declare const Zone: ZoneType & { prototype: Zone };

// Delay of 50 ms to reset currentEventTracingZone.
export const RESET_TRACING_ZONE_DELAY = 50;

export interface TrackerOptions {
  propagation?: Propagation;
}

export class InteractionTracker {
  private options: TrackerOptions;
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
  private static singletonOptions: TrackerOptions;

  private constructor(options: TrackerOptions) {
    this.options = options;
    this.patchZoneRunTask();
    this.patchZoneScheduleTask();
    this.patchZoneCancelTask();
  }

  static startTracking(options: TrackerOptions = {}): InteractionTracker {
    if (!this.singletonInstance || this.singletonOptions !== options) {
      this.singletonInstance = new this(options);
      this.singletonOptions = options;
    }

    return this.singletonInstance;
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
      interceptXhrTask(task, this.options.propagation);
      try {
        return runTask.call(task.zone as {}, task, applyThis, applyArgs);
      } finally {
        if (
          interceptingElement ||
          (shouldCountTask(task) && isTracingZone(task.zone))
        ) {
          this.decrementTaskCount(getTraceId(task.zone));
        }
      }
    };
  }

  private patchZoneScheduleTask() {
    const scheduleTask = Zone.prototype.scheduleTask;
    Zone.prototype.scheduleTask = <T extends Task>(task: T) => {
      const currentZone = Zone.current;
      if (isTracingZone(currentZone)) {
        // Cast first as Task and then as AsyncTask because the direct
        // cast from type `T` is not possible.
        ((task as Task) as AsyncTask)._zone = currentZone;
      }
      try {
        return scheduleTask.call(currentZone as {}, task) as T;
      } finally {
        if (shouldCountTask(task) && isTracingZone(task.zone)) {
          this.incrementTaskCount(getTraceId(task.zone));
        }
      }
    };
  }

  private patchZoneCancelTask() {
    const cancelTask = Zone.prototype.cancelTask;
    Zone.prototype.cancelTask = (task: AsyncTask) => {
      let currentZone = Zone.current;
      if (isTracingZone(currentZone)) {
        task._zone = currentZone;
      } else if (isTracingZone(task.zone)) {
        currentZone = task.zone;
      }

      try {
        return cancelTask.call(currentZone as {}, task);
      } finally {
        if (isTracingZone(task.zone) && shouldCountTask(task)) {
          this.decrementTaskCount(getTraceId(task.zone));
        }
      }
    };
  }

  private startNewInteraction(
    interceptingElement: HTMLElement,
    eventName: string,
    taskZone: Zone,
    interactionName: InteractionName
  ) {
    const traceId = randomTraceId();
    const spanOptions = {
      name: interactionName.name,
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
        this.currentEventTracingZone.get('data')['isRootSpanNameReplaceable'] =
          interactionName.isReplaceable;
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
}

function getTrackedElement(task: AsyncTask): HTMLElement | null {
  if (!(task.eventName && task.eventName === 'click')) return null;

  return task.target as HTMLElement;
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
  // be associated with that same older tracing zone. This is something we have
  // to think of.
  if (task.data.isPeriodic) return false;

  // We're only interested in macroTasks and microTasks.
  return task.type === 'macroTask' || task.type === 'microTask';
}
