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

import { randomTraceId } from '@opencensus/web-core';

// Allows us to monkey patch Zone prototype without TS compiler errors.
declare const Zone: ZoneType & { prototype: Zone };

export interface AsyncTaskData {
  interactionId: string;
  pageView: string;
}

export type AsyncTask = Task & {
  data: AsyncTaskData;
  eventName: string;
  target: HTMLElement;
  // Allows access to the private `_zone` property of a Zone.js Task.
  _zone: Zone;
};

export class InteractionTracker {
  constructor() {

    const runTask = Zone.prototype.runTask;
    Zone.prototype.runTask = function(
      task: AsyncTask,
      applyThis: unknown,
      applyArgs: unknown
    ) {
      const time = Date.now();

      console.warn('Running task');
      console.log(task.zone);

      let taskZone = this;
      if (isTrackedElement(task)) {
        console.log('Click detected');

        const traceId = randomTraceId();
        const tracingZone = Zone.root.fork({
          name: traceId,
          properties: {
            isTracingZone: true,
            traceId,
          },
        });

        // Change the zone task.
        task._zone = tracingZone;
        taskZone = tracingZone;
        console.log('New zone:');
        console.log(taskZone);
      } else {
        // If we already are in a tracing zone, just run the task in our tracing zone.
        if (task.zone && task.zone.get('isTracingZone')) {
          taskZone = task.zone;
        }
      }
      try {
        return runTask.call(taskZone as {}, task, applyThis, applyArgs);
      } finally {
        console.log('Run task finished.');
        console.log('Time to complete: ' + (Date.now() - time));
      }
    };

    const scheduleTask = Zone.prototype.scheduleTask;
    Zone.prototype.scheduleTask = function<T extends Task>(task: T): T {
      console.warn('Scheduling task');
      console.log(task);

      let taskZone: Zone = this;
      if (task.zone && task.zone && task.zone.get('isTracingZone')) {
        taskZone = task.zone;
      }
      try {
        return scheduleTask.call(taskZone as {}, task) as T;
      } finally {
      }
    };

    const cancelTask = Zone.prototype.cancelTask;
    Zone.prototype.cancelTask = function(task: AsyncTask) {
      console.warn('Cancel task');
      console.log(task);

      let taskZone: Zone = this;
      if (task.zone && task.zone.get('isTracingZone')) {
        taskZone = task.zone;
      }

      try {
        return cancelTask.call(taskZone as {}, task);
      } finally {
      }
    };
  }
}

function isTrackedElement(task: AsyncTask): boolean {
  return !!(task.eventName && task.eventName === 'click');
}
