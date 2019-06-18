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
const RESET_TRACING_ZONE_DELAY = 50;

export class InteractionTracker {
  // Allows to track several events triggered by the same user interaction in the right Zone.
  private currentEventTracingZone?: Zone;

  // Map of interaction Ids to stopwatches.
  private readonly interactions: {
    [index: string]: OnPageInteractionStopwatch;
  } = {};

  // Map of interaction Ids to timeout ids.
  private readonly interactionCompletionTimeouts: {
    [index: string]: number;
  } = {};

  constructor() {
    const runTask = Zone.prototype.runTask;
    Zone.prototype.runTask = (
      task: AsyncTask,
      applyThis: unknown,
      applyArgs: unknown
    ) => {
      console.warn('Running task');
      console.log(task);

      const interceptingElement = getTrackedElement(task);
      const interactionName = resolveInteractionName(
        interceptingElement,
        task.eventName
      );
      let taskZone = Zone.current;
      if (interceptingElement) {
        if (this.currentEventTracingZone === undefined && interactionName) {
          this.startNewInteraction(
            interceptingElement,
            task.eventName,
            interactionName
          );
        } else if (this.currentEventTracingZone) {
          task._zone = this.currentEventTracingZone;
          taskZone = this.currentEventTracingZone;
        } else {
          task._zone = Zone.root;
        }
        this.incrementTaskCount(getTraceId(task.zone));
      } else if (isTrackedTask(task)) {
        // If we already are in a tracing zone, just run the task in our tracing zone.
        taskZone = task.zone;
      }
      try {
        return runTask.call(taskZone as {}, task, applyThis, applyArgs);
      } finally {
        console.log('Run task finished.');
        if (
          interceptingElement ||
          (shouldCountTask(task) && isTrackedTask(task))
        ) {
          this.decrementTaskCount(getTraceId(task.zone));
        }
      }
    };

    const scheduleTask = Zone.prototype.scheduleTask;
    Zone.prototype.scheduleTask = <T extends Task>(task: T) => {
      console.warn('Scheduling task');
      console.log(task);

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
        console.warn('Finished Scheduling task');
      }
    };

    const cancelTask = Zone.prototype.cancelTask;
    Zone.prototype.cancelTask = (task: AsyncTask) => {
      console.warn('Cancel task');
      console.log(task);

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
        console.warn('Finished cancel task');
      }
    };
  }

  private startNewInteraction(
    interceptingElement: HTMLElement,
    eventName: string,
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
    // Start a new RootSpan for a new user interaction.
    tracing.tracer.startRootSpan(spanOptions, root => {
      // As startRootSpan creates the zone and Zone.current corresponds to the
      // new zone, we have to set the currentEventTracingZone with the Zone.current
      // to capture the new zone.
      this.currentEventTracingZone = Zone.current;
    });

    this.interactions[traceId] = startOnPageInteraction({
      eventType: eventName,
      target: interceptingElement,
      rootSpan: getRootSpan(this.currentEventTracingZone),
    });
    // Timeout to reset currentEventTracingZone to allow the creation of a new
    // zone for a new user interaction.
    Zone.root.run(() =>
      setTimeout(
        () => (this.currentEventTracingZone = undefined),
        RESET_TRACING_ZONE_DELAY
      )
    );
    console.log('New zone:');
    console.log(this.currentEventTracingZone);
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

/**
 * Get the trace ID from the zone properties.
 * @param zone
 */
function getTraceId(zone: Zone): string {
  return zone && zone.get('data') ? zone.get('data').traceId : '';
}

/**
 * Get the root span from the zone properties.
 * @param zone
 */
function getRootSpan(zone: Zone | undefined): RootSpan {
  return zone && zone.get('data') ? zone.get('data').rootSpan : undefined;
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

  // Don't count periodic tasks with a delay greater than 1 s.
  if (task.data.isPeriodic && (task.data.delay && task.data.delay >= 1000)) {
    return false;
  }

  // We're only interested in macroTasks and microTasks.
  return task.type === 'macroTask' || task.type === 'microTask';
}
