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

// Allows us to monkey patch Zone prototype without TS compiler errors.
declare const Zone: ZoneType & { prototype: Zone };

export interface AsyncTaskData {
    interactionId: string;
    pageView: string;
}

export type AsyncTask =
    Task & { data: AsyncTaskData, eventName: string, target: HTMLElement };

export class InteractionTracker {
    constructor() {
        const runTask = Zone.prototype.runTask;
        Zone.prototype.runTask = function (
            // tslint:disable-next-line:no-any Implement Zone interface.
            task: AsyncTask,
            applyThis: any,
            applyArgs: any
        ) {
            if (task.eventName && task.eventName.toString().indexOf('click') !== -1) {
                console.log('Running task');   
                console.log("Click detected");
            }
            try {
                return runTask.call(this as {}, task, applyThis, applyArgs);
            } finally {
            }
        };

        const scheduleTask = Zone.prototype.scheduleTask;
        Zone.prototype.scheduleTask = function<T extends Task>(task: T): T {
          try {
            return scheduleTask.call(this as {}, task) as T;
          } finally {
          }
        };

        const cancelTask = Zone.prototype.cancelTask;
        Zone.prototype.cancelTask = function(task: AsyncTask) {
          console.log('cancel task');
          try {
            return cancelTask.call(this as {}, task);
          } finally {
          }
        };
    }
}
