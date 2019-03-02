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

import {PerformanceLongTaskTiming, PerformanceNavigationTimingExtended, PerformancePaintTiming, PerformanceResourceTimingExtended, WindowWithLongTasks} from './perf-types';

/** Cast `window` to be access the `ocwLt` field for long task timings.  */
const windowWithLongTasks = window as WindowWithLongTasks;

/** Represent all collected performance timings grouped by type. */
export interface GroupedPerfEntries {
  navigationTiming?: PerformanceNavigationTimingExtended;
  paintTimings: PerformancePaintTiming[];
  resourceTimings: PerformanceResourceTimingExtended[];
  longTasks: PerformanceLongTaskTiming[];
}

/** Returns the recorded performance entries but does not clear them. */
export function getPerfEntries(): GroupedPerfEntries {
  if (!window.performance) {
    return {
      resourceTimings: [],
      longTasks: [],
      paintTimings: [],
    };
  }

  const perf = window.performance;

  const longTasks = windowWithLongTasks.ocwLt;

  const entries: GroupedPerfEntries = {
    resourceTimings: perf.getEntriesByType('resource') as
        PerformanceResourceTimingExtended[],
    paintTimings: perf.getEntriesByType('paint') as PerformancePaintTiming[],
    longTasks: longTasks ? longTasks.slice() : [],
  };

  const navEntries = perf.getEntriesByType('navigation');
  if (navEntries.length) {
    entries.navigationTiming =
        navEntries[0] as PerformanceNavigationTimingExtended;
  }

  return entries;
}

/** Clears resource timings, marks, measures and stored long task timings. */
export function clearPerfEntries() {
  if (!window.performance) return;
  windowWithLongTasks.ocwLt = [];
  performance.clearResourceTimings();
  performance.clearMarks();
  performance.clearMeasures();
}
