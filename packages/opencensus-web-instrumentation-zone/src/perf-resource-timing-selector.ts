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

import { Span } from '@opencensus/web-core';
import { XhrPerformanceResourceTiming } from './zone-types';

/**
 * Get Browser's performance resource timing data associated to a XHR.
 * For this case, some XHR might have two or one performance resource
 * timings as one of them is CORS pre-flight request and the second is related
 * to the actual HTTP request.
 * The algorithm to select performance resource timings related to that xhr is
 * is composed in general by three steps:
 *
 * 1. Filter the Performance Resource Timings by the name (it should match the
 * XHR URL), additionally, the start/end timings of every performance entry
 * should fit within the span start/end timings. These filtered performance
 * resource entries are considered as possible entries associated to the xhr.
 * Those are possible as there might be more than two entries that pass the
 * filter.
 *
 * 2. As the XHR could cause a CORS pre-flight, we have to look for either
 * possible pairs of performance resource timings or a single performance
 * resource entry (a possible pair is when a resource timing entry does not
 * overlap timings with other resource timing entry. Also, a possible single
 * resource timing is when that resource timing entry is not paired with any
 * other entry). Thus, for this step traverse the array of possible resource
 * entries and for every entry try to pair it with the other possible entries.
 *
 * 3. Pick the best performance resource timing for the XHR: Using the possible
 * performance resource timing entries from previous step, the best entry will
 * be the one with the minimum gap to the span start/end timings. That is the
 * substraction between the entry `respondeEnd` value and the span
 * `endPerfTime` plus the substraction between the entry `startTime` and span
 * `startPerfTime`. In case it is a tuple, the `startTime` corresponds to the
 * first entry and the `responseEnd` is from second entry.
 * The performance resource timing entry with the minimum gap to the span
 * start/end timings points out that entry is the best fit for the span.
 *
 * @param xhrUrl
 * @param span
 */
export function getXhrPerfomanceData(
  xhrUrl: string,
  span: Span
): XhrPerformanceResourceTiming | undefined {
  const filteredPerfEntries = getPerfResourceEntries(xhrUrl, span);
  const possibleEntries = getPossiblePerfResourceEntries(filteredPerfEntries);
  const bestEntry = getBestPerfResourceTiming(possibleEntries, span);
  return bestEntry;
}

// Get Performance Resource Timings and filter them by matching the XHR url
// with perfomance entry name. Additionally, the entry's start/end
// timings must fit with in the span's start/end timings.
export function getPerfResourceEntries(
  xhrUrl: string,
  span: Span
): PerformanceResourceTiming[] {
  return performance
    .getEntriesByType('resource')
    .filter(entry =>
      isPerfEntryPartOfXhr(entry as PerformanceResourceTiming, xhrUrl, span)
    ) as PerformanceResourceTiming[];
}

export function getPossiblePerfResourceEntries(
  perfEntries: PerformanceResourceTiming[]
): XhrPerformanceResourceTiming[] {
  const possiblePerfEntries = new Array<XhrPerformanceResourceTiming>();
  const pairedEntries = new Set<PerformanceResourceTiming>();
  let perfEntry1: PerformanceResourceTiming;
  let perfEntry2: PerformanceResourceTiming;
  // As this part of the algorithm traverses the array twice, although,
  // this array is not big as the performance resource entries is cleared
  // when there are no more running XHRs.
  for (let i = 0; i < perfEntries.length; i++) {
    perfEntry1 = perfEntries[i];
    // Compare every performance entry with its consecutive perfomance entries.
    // That way to avoid comparing twice the entries.
    for (let j = i + 1; j < perfEntries.length; j++) {
      perfEntry2 = perfEntries[j];
      if (!overlappingPerfResourceTimings(perfEntry1, perfEntry2)) {
        // As the entries are not overlapping, that means those timings
        // are possible perfomance timings related to the XHR.
        possiblePerfEntries.push([perfEntry1, perfEntry2]);
        pairedEntries.add(perfEntry1);
        pairedEntries.add(perfEntry2);
      }
    }
    // If the entry1 couldn't be paired with any other resource timing,
    // add it as a single resource timing. This is possible because this
    // single entry might be better that the other possible entries.
    if (!pairedEntries.has(perfEntry1)) {
      possiblePerfEntries.push(perfEntry1 as PerformanceResourceTiming);
    }
  }
  return possiblePerfEntries;
}

// The best Performance Resource Timing Entry is considered the one with the
// minimum gap the span end/start timings. That way we think that it fits
// better to the XHR as it is the closest data to the actual XHR.
function getBestPerfResourceTiming(
  perfEntries: XhrPerformanceResourceTiming[],
  span: Span
): XhrPerformanceResourceTiming | undefined {
  let minimumGapToSpan = Number.MAX_VALUE;
  let bestPerfEntry: XhrPerformanceResourceTiming | undefined = undefined;
  let sumGapsToSpan: number;
  for (const perfEntry of perfEntries) {
    // As a Tuple is in the end an Array, check that perfEntry is instance of
    // Array is enough to know if this value refers to a Tuple.
    if (perfEntry instanceof Array) {
      sumGapsToSpan = Math.abs(perfEntry[0].startTime - span.startPerfTime);
      sumGapsToSpan += Math.abs(perfEntry[1].responseEnd - span.endPerfTime);
    } else {
      sumGapsToSpan = Math.abs(perfEntry.responseEnd - span.endPerfTime);
      sumGapsToSpan += Math.abs(perfEntry.startTime - span.startPerfTime);
    }
    // If there is a new minimum gap to the span, update the minimum and pick
    // the current performance entry as the best at this point.
    if (sumGapsToSpan < minimumGapToSpan) {
      minimumGapToSpan = sumGapsToSpan;
      bestPerfEntry = perfEntry;
    }
  }
  return bestPerfEntry;
}

function isPerfEntryPartOfXhr(
  entry: PerformanceResourceTiming,
  xhrUrl: string,
  span: Span
): boolean {
  return (
    entry.name === xhrUrl &&
    entry.startTime >= span.startPerfTime &&
    entry.responseEnd <= span.endPerfTime
  );
}

function overlappingPerfResourceTimings(
  entry1: PerformanceResourceTiming,
  entry2: PerformanceResourceTiming
): boolean {
  return (
    Math.min(entry1.responseEnd, entry2.responseEnd) >=
    Math.max(entry1.startTime, entry2.startTime)
  );
}
