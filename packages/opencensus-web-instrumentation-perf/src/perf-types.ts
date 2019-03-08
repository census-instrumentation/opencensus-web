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

/**
 * @fileoverview These are TypeScript interfaces for performance timing API.
 * These are needed because not all performance API types are included in TS.
 * See: https://github.com/Microsoft/TypeScript/issues/19816
 * Many of these were adapted from here:
 *  https://github.com/Microsoft/TypeScript/blame/cca2631a90fb414f7c830f2d2895a3b5f0db896f/lib/lib.webworker.d.ts#L1741httpf://github.com/Microsoft/TypeScript/blame/cca2631a90fb414f7c830f2d2895a3b5f0db896f/lib/lib.webworker.d.ts#L1741
 *
 * These interfaces use `declare` as an indicator that their properties should
 * not be renamed by minifiers e.g. the Closure Compiler, which will be relevant
 * once OpenCensus Web can produce optimized builds.
 * See: https://github.com/angular/tsickle#declare
 */

/**
 * Performance information sent from server in the `Server-Timing` header.
 * See https://developer.mozilla.org/en-US/docs/Web/API/PerformanceServerTiming
 */
export declare interface PerformanceServerTiming {
  readonly description: string;
  readonly duration: number;
  readonly name: string;
}

/** Type for the `toJSON` function that is included in performance types. */
export type toJSONFunction = () => {};

/**
 * Performance timing for resources fetched for the page e.g. CSS, XHRs, etc.
 * See:
 * https://developer.mozilla.org/en-US/docs/Web/API/PerformanceResourceTiming
 */
export declare interface PerformanceResourceTimingExtended extends
    PerformanceEntry {
  /** Index signature allows annotations generation from a list of fields. */
  [index: string]: number|undefined|PerformanceServerTiming[]|string|
      toJSONFunction;

  readonly serverTiming?: PerformanceServerTiming[];

  readonly connectEnd: number;
  readonly connectStart: number;
  readonly decodedBodySize: number;
  readonly domainLookupEnd: number;
  readonly domainLookupStart: number;
  readonly encodedBodySize: number;
  readonly fetchStart: number;
  readonly initiatorType: string;
  readonly nextHopProtocol: string;
  readonly redirectEnd: number;
  readonly redirectStart: number;
  readonly requestStart: number;
  readonly responseEnd: number;
  readonly responseStart: number;
  readonly secureConnectionStart: number;
  readonly transferSize: number;
  readonly workerStart: number;
  toJSON: toJSONFunction;
}

/**
 * Performance timing for the initial user navigation and HTML load.
 * See:
 * https://developer.mozilla.org/en-US/docs/Web/API/PerformanceNavigationTiming
 */
export declare interface PerformanceNavigationTimingExtended extends
    PerformanceResourceTimingExtended {
  readonly initiatorType: 'navigation';

  readonly domComplete: number;
  readonly domContentLoadedEventEnd: number;
  readonly domContentLoadedEventStart: number;
  readonly domInteractive: number;
  readonly loadEventEnd: number;
  readonly loadEventStart: number;
  readonly type: NavigationType;
  readonly unloadEventEnd: number;
  readonly unloadEventStart: number;
  readonly redirectCount: number;
}

/**
 * Interface for PeformanceObserver, a utility to be notified for performance
 * events. This is the only way to record long task timings.
 * See https://developer.mozilla.org/en-US/docs/Web/API/PerformanceObserver
 */
export declare interface PerformanceObserver {
  new(callback:
          (entries: PerformanceObserverEntryList,
           observer: PerformanceObserver) => void): PerformanceObserver;
  disconnect(): void;
  observe(options: PerformanceObserverConfig): void;
  takeRecords(): PerformanceEntry[];
}

/** Types of entries that a PerformanceObserver can observe. */
export type PerformanceObserverEntryType =
    'frame'|'navigation'|'resource'|'mark'|'measure'|'paint'|'longtask';

/** Type for the config passed to the PerformanceObserver.observe method. */
export declare interface PerformanceObserverConfig {
  readonly buffered?: boolean;
  readonly entryTypes: PerformanceObserverEntryType[];
}

/** Type for the performance entry list sent to performance observers. */
export declare interface PerformanceObserverEntryList {
  getEntries(): PerformanceEntry[];
  getEntriesByName(name: string, type?: string): PerformanceEntry[];
  getEntriesByType(type: string): PerformanceEntry[];
}

/**
 * Performance timing entry for paint events, e.g. first contentful paint.
 * See: https://developer.mozilla.org/en-US/docs/Web/API/PerformancePaintTiming
 */
export declare interface PerformancePaintTiming extends PerformanceEntry {
  readonly entryType: 'paint';
  readonly name: 'first-paint'|'first-contentful-paint';
}

/**
 * Additional attribution information about long task timings.
 * See https://developer.mozilla.org/en-US/docs/Web/API/TaskAttributionTiming
 */
export declare interface TaskAttributionTiming {
  readonly containerType: 'iframe'|'embed'|'object';
  readonly containerSrc: string;
  readonly containerId: string;
  readonly containerName: string;
  readonly name: string;
  readonly entryType: 'taskattribution';
  readonly startTime: number;
  readonly duration: number;
}

/**
 * Performance entry for "long tasks", that is JS event loops that take > 50ms.
 * See
 * https://developer.mozilla.org/en-US/docs/Web/API/PerformanceLongTaskTiming
 */
export declare interface PerformanceLongTaskTiming extends PerformanceEntry {
  readonly entryType: 'longtask';
  readonly attribution: TaskAttributionTiming[];
}

/** Type for the `window` object with a field to track LongTask timings. */
export declare interface WindowWithLongTasks extends Window {
  readonly PerformanceObserver?: PerformanceObserver;
  ocwLt?: PerformanceLongTaskTiming[];
}
