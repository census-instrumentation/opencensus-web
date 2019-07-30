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

import { PerformanceResourceTimingExtended } from '@opencensus/web-instrumentation-perf';

export function createFakePerfResourceEntry(
  startTime: number,
  endTime: number,
  name = '/test'
): PerformanceResourceTimingExtended {
  return {
    connectEnd: 0,
    connectStart: 0,
    decodedBodySize: 0,
    domainLookupEnd: 0,
    domainLookupStart: 0,
    duration: endTime - startTime,
    encodedBodySize: 0,
    entryType: 'resource',
    fetchStart: startTime,
    initiatorType: 'xmlhttprequest',
    name,
    nextHopProtocol: 'h2',
    redirectEnd: 0,
    redirectStart: 0,
    redirectCount: 0,
    requestStart: 0,
    responseEnd: endTime,
    responseStart: 0,
    secureConnectionStart: 0,
    serverTiming: [],
    startTime,
    transferSize: 0,
    workerStart: 0,
    toJSON: () => ({}),
  };
}

/**
 * Spies on Performance.getEntriesByType('resoruce') to return the given value
 * rather than the actual value.
 */
export function spyPerfEntryByType(
  perfResourceEntries: PerformanceResourceTiming[]
) {
  spyOn(performance, 'getEntriesByType').and.callFake((entryType: string) => {
    if (entryType === 'resource') return perfResourceEntries;
    else return [];
  });
}
