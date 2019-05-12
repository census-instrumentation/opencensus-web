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

import { recordLongTasks } from '../src/long-tasks-recorder';
import { clearPerfEntries, getPerfEntries } from '../src/perf-grouper';
import {
  PerformanceLongTaskTiming,
  PerformanceNavigationTimingExtended,
  PerformanceObserver,
  PerformanceObserverConfig,
  PerformanceObserverEntryList,
  PerformancePaintTiming,
  PerformanceResourceTimingExtended,
} from '../src/perf-types';

const LONG_TASK_1: PerformanceLongTaskTiming = {
  name: 'self',
  entryType: 'longtask',
  startTime: 1,
  duration: 2,
  attribution: [],
  toJSON: () => ({}),
};
const LONG_TASK_2: PerformanceLongTaskTiming = {
  name: 'self',
  entryType: 'longtask',
  startTime: 3,
  duration: 4,
  attribution: [],
  toJSON: () => ({}),
};
const NAVIGATION_ENTRY: PerformanceNavigationTimingExtended = {
  name: 'http://localhost:4200/',
  entryType: 'navigation',
  startTime: 0,
  duration: 20985.30000000028,
  initiatorType: 'navigation',
  nextHopProtocol: 'http/1.1',
  workerStart: 0,
  redirectStart: 0,
  redirectEnd: 0,
  fetchStart: 25.100000002566958,
  domainLookupStart: 28.09999999954016,
  domainLookupEnd: 28.09999999954016,
  connectStart: 28.09999999954016,
  connectEnd: 28.300000001763692,
  secureConnectionStart: 0,
  requestStart: 28.500000000349246,
  responseStart: 384.6000000012282,
  responseEnd: 394.20000000245636,
  transferSize: 4667,
  encodedBodySize: 4404,
  decodedBodySize: 4404,
  serverTiming: [],
  unloadEventStart: 0,
  unloadEventEnd: 0,
  domInteractive: 12126.70000000071,
  domContentLoadedEventStart: 12126.70000000071,
  domContentLoadedEventEnd: 12933.80000000252,
  domComplete: 20967.70000000106,
  loadEventStart: 20967.899999999645,
  loadEventEnd: 20985.30000000028,
  type: 'navigate',
  redirectCount: 0,
  toJSON: () => ({}),
};
const PAINT_ENTRY: PerformancePaintTiming = {
  name: 'first-paint',
  entryType: 'paint',
  startTime: 606.9000000024971,
  duration: 0,
  toJSON: () => ({}),
};
const RESOURCE_ENTRY: PerformanceResourceTimingExtended = {
  connectEnd: 0,
  connectStart: 0,
  decodedBodySize: 0,
  domainLookupEnd: 0,
  domainLookupStart: 0,
  duration: 13.100000011036173,
  encodedBodySize: 0,
  entryType: 'resource',
  fetchStart: 266.9999999925494,
  initiatorType: 'link',
  name: 'http://localhost:4200/resource',
  nextHopProtocol: 'h2',
  redirectEnd: 0,
  redirectStart: 0,
  redirectCount: 0,
  requestStart: 0,
  responseEnd: 280.1000000035856,
  responseStart: 0,
  secureConnectionStart: 0,
  serverTiming: [],
  startTime: 266.9999999925494,
  transferSize: 0,
  workerStart: 0,
  toJSON: () => ({}),
};
const PERF_ENTRIES_BY_TYPE = new Map<string, PerformanceEntry[]>([
  ['navigation', [NAVIGATION_ENTRY]],
  ['paint', [PAINT_ENTRY]],
  ['resource', [RESOURCE_ENTRY]],
]);

declare type WindowWithMutablePerformanceObserver = Window & {
  PerformanceObserver?: PerformanceObserver;
};

const windowWithPerfObserver = window as WindowWithMutablePerformanceObserver;

describe('performance recorder functions', () => {
  class MockPerfEntryList implements PerformanceObserverEntryList {
    constructor(readonly entries: PerformanceEntry[]) {}
    getEntries() {
      return this.entries;
    }
    getEntriesByName(): never {
      throw new Error('MockPerfEntryList.getEntriesByName unexpectedly called');
    }
    getEntriesByType(): never {
      throw new Error('MockPerfEntryList.getEntriesByType unexpectedly called');
    }
  }

  class MockPerformanceObserver {
    config?: PerformanceObserverConfig;
    constructor(
      readonly callback: (
        entries: PerformanceObserverEntryList,
        observer: PerformanceObserver
      ) => void
    ) {
      performanceObserver = this;
    }
    observe(config: PerformanceObserverConfig) {
      this.config = config;
    }
    sendMockPerfEntries(entryList: PerformanceObserverEntryList) {
      // The cast is needed because TS interfaces with `new` can't be
      // implemented with classes. See
      // https://stackoverflow.com/questions/13407036/how-does-typescript-interfaces-with-construct-signatures-work
      this.callback(entryList, (this as unknown) as PerformanceObserver);
    }
  }

  const realPerformanceObserver = windowWithPerfObserver.PerformanceObserver;
  let performanceObserver: MockPerformanceObserver | undefined;

  beforeEach(() => {
    clearPerfEntries(); // Needed to reset long tasks list.
    windowWithPerfObserver.PerformanceObserver = (MockPerformanceObserver as unknown) as PerformanceObserver;
  });
  afterEach(() => {
    windowWithPerfObserver.PerformanceObserver = realPerformanceObserver;
  });

  describe('recordLongTasks', () => {
    it('starts tracking long tasks', () => {
      recordLongTasks();
      expect(performanceObserver).toBeDefined();
      expect(performanceObserver!.config).toEqual({ entryTypes: ['longtask'] });
    });
  });

  describe('getPerfEntries', () => {
    it('combines perf entries for nav, paint, resource and long tasks', () => {
      recordLongTasks();
      performanceObserver!.sendMockPerfEntries(
        new MockPerfEntryList([LONG_TASK_1, LONG_TASK_2])
      );
      spyOn(performance, 'getEntriesByType').and.callFake(
        (entryType: string) => {
          return PERF_ENTRIES_BY_TYPE.get(entryType);
        }
      );

      expect(getPerfEntries()).toEqual({
        navigationTiming: NAVIGATION_ENTRY,
        paintTimings: [PAINT_ENTRY],
        resourceTimings: [RESOURCE_ENTRY],
        longTaskTimings: [LONG_TASK_1, LONG_TASK_2],
      });
    });
  });

  describe('clearPerfEntries', () => {
    it('clears resource timings, marks and measures', () => {
      spyOn(performance, 'clearResourceTimings');
      spyOn(performance, 'clearMarks');
      spyOn(performance, 'clearMeasures');

      clearPerfEntries();

      expect(performance.clearResourceTimings).toHaveBeenCalled();
      expect(performance.clearMarks).toHaveBeenCalled();
      expect(performance.clearMeasures).toHaveBeenCalled();
    });

    it('clears stored long tasks', () => {
      recordLongTasks();
      performanceObserver!.sendMockPerfEntries(
        new MockPerfEntryList([LONG_TASK_1])
      );
      expect(getPerfEntries().longTaskTimings.length).toBe(1);

      clearPerfEntries();

      expect(getPerfEntries().longTaskTimings.length).toBe(0);
    });
  });
});
