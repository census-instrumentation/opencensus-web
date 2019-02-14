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

import {PerformanceLongTaskTiming, PerformanceNavigationTimingExtended, PerformanceObserverEntryList, PerformancePaintTiming, PerformanceResourceTimingExtended, WindowWithPerformanceObserver} from './perf-types';

/** Cast `window` to have PerformanceObserver. */
const windowWithPerfObserver = window as WindowWithPerformanceObserver;

/** Store long task performance entries recorded with PerformanceObserver. */
const longTasks: PerformanceLongTaskTiming[] = [];

/** How big to set the performance timing buffer so timings aren't lost. */
const RESOURCE_TIMING_BUFFER_SIZE = 2000;

/** Represent all collected performance timings grouped by type. */
export interface GroupedPerfEntries {
  navigationTiming?: PerformanceNavigationTimingExtended;
  paintTimings: PerformancePaintTiming[];
  resourceTimings: PerformanceResourceTimingExtended[];
  longTasks: PerformanceLongTaskTiming[];
}

/**
 * Begin recording performance timings. This starts tracking `longtask` timings
 * and also increases the resource timing buffer size.
 */
export function recordPerfEntries() {
  if (!windowWithPerfObserver.performance) return;

  if (performance.setResourceTimingBufferSize) {
    performance.setResourceTimingBufferSize(RESOURCE_TIMING_BUFFER_SIZE);
  }

  if (windowWithPerfObserver.PerformanceObserver) {
    const longTaskObserver =
        new windowWithPerfObserver.PerformanceObserver(onLongTasks);
    longTaskObserver.observe({entryTypes: ['longtask']});
  }
}

function onLongTasks(entryList: PerformanceObserverEntryList) {
  // These must be PerformanceLongTaskTiming objects because we only observe
  // 'longtask' above.
  longTasks.push(...(entryList.getEntries() as PerformanceLongTaskTiming[]));
}

/** Returns the recorded performance entries but does not clear them. */
export function getPerfEntries(): GroupedPerfEntries {
  if (!windowWithPerfObserver.performance) {
    return {
      resourceTimings: [],
      longTasks: [],
      paintTimings: [],
    };
  }

  const perf = windowWithPerfObserver.performance;

  const entries: GroupedPerfEntries = {
    resourceTimings: perf.getEntriesByType('resource') as
        PerformanceResourceTimingExtended[],
    paintTimings: perf.getEntriesByType('paint') as PerformancePaintTiming[],
    longTasks: longTasks.slice(),
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
  if (!windowWithPerfObserver.performance) return;
  longTasks.length = 0;
  windowWithPerfObserver.performance.clearResourceTimings();
  windowWithPerfObserver.performance.clearMarks();
  windowWithPerfObserver.performance.clearMeasures();
}

/** Expose the resource timing buffer size for unit test. */
export const TEST_ONLY = {RESOURCE_TIMING_BUFFER_SIZE};
