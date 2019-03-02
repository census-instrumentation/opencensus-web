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


import {PerformanceLongTaskTiming, PerformanceObserverEntryList, WindowWithLongTasks} from './perf-types';

/** Cast `window` to be access the `ocwLt` field for long task timings.  */
const windowWithLongTasks = window as WindowWithLongTasks;

/**
 * Begin recording `longtask` timings. These need to be captured using
 * `PerformanceObserver`.
 */
export function recordLongTasks() {
  if (!windowWithLongTasks.performance) return;
  if (windowWithLongTasks.PerformanceObserver) {
    const longTaskObserver =
        new windowWithLongTasks.PerformanceObserver(onLongTasks);
    longTaskObserver.observe({entryTypes: ['longtask']});
  }
  windowWithLongTasks.ocwLt = [];
}

function onLongTasks(entryList: PerformanceObserverEntryList) {
  // These must be PerformanceLongTaskTiming objects because we only observe
  // 'longtask' above.
  windowWithLongTasks.ocwLt!.push(
      ...(entryList.getEntries() as PerformanceLongTaskTiming[]));
}
