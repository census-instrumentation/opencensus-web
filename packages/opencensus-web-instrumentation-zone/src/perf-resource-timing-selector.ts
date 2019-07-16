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
 * Some XHRs might have two or one performance resource timings as one of them
 * is the CORS pre-flight request and the second is related to the actual HTTP
 * request.
 * In overall, the algorithm to get this data takes the best fit for the span,
 * this means the closest performance resource timing to the span start/end
 * performance times is the returned value.
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

/**
 * First step for the algorithm. Filter the Performance Resource Timings by the
 * name (it should match the XHR URL), additionally, the start/end timings of
 * every performance entry should fit within the span start/end timings.
 * These filtered performance resource entries are considered as possible
 * entries associated to the xhr.
 * Those are possible because there might be more than two entries that pass the
 * filter.
 * @param xhrUrl
 * @param span
 */
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

/**
 * Second step for the 'Performance resource timings selector algorithm'.
 * As the XHR could cause a CORS pre-flight request, we have to look for
 * possible performance entries either containing cors preflight timings or not.
 * A possible entry with cors data is when a resource timing entry does not
 * overlap timings with other resource timing entry. Also, a possible entry
 * without cors resource timing is when that resource timing entry is not
 * 'paired' with any other entry.
 * Thus, for this step traverse the array of resource entries and for every
 * entry check if it is a possible performance resource entry.
 * @param perfEntries
 */
export function getPossiblePerfResourceEntries(
  perfEntries: PerformanceResourceTiming[]
): XhrPerformanceResourceTiming[] {
  const possiblePerfEntries = new Array<XhrPerformanceResourceTiming>();
  const pairedEntries = new Set<PerformanceResourceTiming>();
  let entryI: PerformanceResourceTiming;
  let entryJ: PerformanceResourceTiming;
  // As this part of the algorithm traverses the array twice, although,
  // this array is not large as the performance resource entries buffer is
  // cleared when there are no more running XHRs.
  for (let i = 0; i < perfEntries.length; i++) {
    entryI = perfEntries[i];
    // Compare every performance entry with its consecutive perfomance entries.
    // That way to avoid comparing twice the entries.
    for (let j = i + 1; j < perfEntries.length; j++) {
      entryJ = perfEntries[j];
      if (!overlappingPerfResourceTimings(entryI, entryJ)) {
        // As the entries are not overlapping, that means those timings
        // are possible perfomance timings related to the XHR.
        possiblePerfEntries.push({
          corsPreFlightRequest: entryI,
          mainRequest: entryJ,
        });
        pairedEntries.add(entryI);
        pairedEntries.add(entryJ);
      }
    }
    // If the entry couldn't be paired with any other resource timing,
    // add it as a possible resource timing without cors preflight data.
    // This is possible because this entry might be better than the other
    // possible entries.
    if (!pairedEntries.has(entryI)) {
      possiblePerfEntries.push({ mainRequest: entryI });
    }
  }
  return possiblePerfEntries;
}

// Pick the best performance resource timing for the XHR: Using the possible
// performance resource timing entries from previous step, the best entry will
// be the one with the minimum gap to the span start/end timings.
// The performance resource timing entry with the minimum gap to the span
// start/end timings points out that entry is the best fit for the span.
function getBestPerfResourceTiming(
  perfEntries: XhrPerformanceResourceTiming[],
  span: Span
): XhrPerformanceResourceTiming | undefined {
  let minimumGapToSpan = Number.MAX_VALUE;
  let bestPerfEntry: XhrPerformanceResourceTiming | undefined = undefined;
  for (const perfEntry of perfEntries) {
    let gapToSpan = Math.abs(
      perfEntry.mainRequest.responseEnd - span.endPerfTime
    );
    // If the current entry has cors preflight data use its `startTime` to
    // calculate the gap to the span.
    if (perfEntry.corsPreFlightRequest) {
      gapToSpan += Math.abs(
        perfEntry.corsPreFlightRequest.startTime - span.startPerfTime
      );
    } else {
      gapToSpan += Math.abs(
        perfEntry.mainRequest.startTime - span.startPerfTime
      );
    }
    // If there is a new minimum gap to the span, update the minimum and pick
    // the current performance entry as the best at this point.
    if (gapToSpan < minimumGapToSpan) {
      minimumGapToSpan = gapToSpan;
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
