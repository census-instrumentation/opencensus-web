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
import { alreadyAssignedPerfEntries } from './xhr-interceptor';

/**
 * Get Browser's performance resource timing data associated to a XHR.
 * Some XHRs might have two or one performance resource timings as one of them
 * is the CORS pre-flight request and the second is related to the actual HTTP
 * request.
 * In overall, the algorithm to get this data takes the best fit for the span,
 * this means the closest performance resource timing to the span start/end
 * performance times is the returned value.
 */
export function getXhrPerfomanceData(
  xhrUrl: string,
  span: Span
): XhrPerformanceResourceTiming | undefined {
  const filteredSortedPerfEntries = getPerfSortedResourceEntries(xhrUrl, span);
  const possibleEntries = getPossiblePerfResourceEntries(
    filteredSortedPerfEntries
  );
  return getBestPerfResourceTiming(possibleEntries, span);
}

/**
 * First step for the algorithm. Filter the Performance Resource Timings by the
 * name (it should match the XHR URL), additionally, the start/end timings of
 * every performance entry should fit within the span start/end timings. Also,
 * the entry should not be already assigned to a span.
 * These filtered performance resource entries are considered as possible
 * entries associated to the xhr.
 * Those are possible because there might be more than two entries that pass the
 * filter.
 * Additionally, the returned array is sorted by the entries' `startTime` as
 * getEntriesByType() already does it.
 * (https://developer.mozilla.org/en-US/docs/Web/API/Performance/getEntriesByType#Return_Value).
 */
export function getPerfSortedResourceEntries(
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
 * overlap timings with other resource timing entry. Also, every entry is
 * considered as possible XHR performance entry.
 * Thus, for this step traverse the array of resource entries and for every
 * entry check if it is a possible performance resource entry.
 * @param filteredSortedPerfEntries Sorted array of Performance Resource
 * Entries. This is sorted by the entries' `startTime`.
 */
export function getPossiblePerfResourceEntries(
  filteredSortedPerfEntries: PerformanceResourceTiming[]
): XhrPerformanceResourceTiming[] {
  const possiblePerfEntries = new Array<XhrPerformanceResourceTiming>();
  // As this part of the algorithm uses nested for loops to examine pairs of
  // entries, although, this array is not large as the performance resource
  // entries buffer is cleared when there are no more running XHRs. Also, this
  // data is already filtered by URL and start/end time to be within the span.
  for (let i = 0; i < filteredSortedPerfEntries.length; i++) {
    const entryI = filteredSortedPerfEntries[i];
    // Consider the current entry as a possible entry without cors preflight
    // request. This is valid as this entry might be better than other possible
    // entries.
    possiblePerfEntries.push({ mainRequest: entryI });
    // Compare every performance entry with the perfomance entries in front of
    // it. This is possible as the entries are sorted by the startTime. That
    // way, we avoid comparing twice the entries and taking the wrong order.
    for (let j = i + 1; j < filteredSortedPerfEntries.length; j++) {
      const entryJ = filteredSortedPerfEntries[j];
      if (isPossibleCorsPair(entryI, entryJ)) {
        // As the entries are not overlapping, that means those timings
        // are possible perfomance timings related to the XHR.
        possiblePerfEntries.push({
          corsPreFlightRequest: entryI,
          mainRequest: entryJ,
        });
      }
    }
  }
  return possiblePerfEntries;
}

/**
 * Pick the best performance resource timing for the XHR: Using the possible
 * performance resource timing entries from previous step, the best entry will
 * be the one with the minimum gap to the span start/end timings.
 * The performance resource timing entry with the minimum gap to the span
 * start/end timings points out that entry is the best fit for the span.
 */
function getBestPerfResourceTiming(
  perfEntries: XhrPerformanceResourceTiming[],
  span: Span
): XhrPerformanceResourceTiming | undefined {
  let minimumGapToSpan = Number.MAX_VALUE;
  let bestPerfEntry: XhrPerformanceResourceTiming | undefined;
  for (const perfEntry of perfEntries) {
    // If the current entry has cors preflight data use its `startTime` to
    // calculate the gap to the span.
    const perfEntryStartTime = perfEntry.corsPreFlightRequest
      ? perfEntry.corsPreFlightRequest.startTime
      : perfEntry.mainRequest.startTime;
    const gapToSpan =
      span.endPerfTime -
      perfEntry.mainRequest.responseEnd +
      (perfEntryStartTime - span.startPerfTime);

    // If there is a new minimum gap to the span, update the minimum and pick
    // the current performance entry as the best at this point.
    if (gapToSpan < minimumGapToSpan) {
      minimumGapToSpan = gapToSpan;
      bestPerfEntry = perfEntry;
    }
  }
  return bestPerfEntry;
}

/**
 * A Performance entry is part of a XHR if entry has not been assigned
 * previously to another XHR and the URL is the same as the XHR and the
 * entry's start/end times are within the span's start/end times.
 */
function isPerfEntryPartOfXhr(
  entry: PerformanceResourceTiming,
  xhrUrl: string,
  span: Span
): boolean {
  return (
    !alreadyAssignedPerfEntries.has(entry) &&
    entry.name === xhrUrl &&
    entry.startTime >= span.startPerfTime &&
    entry.responseEnd <= span.endPerfTime
  );
}

/**
 * A possible CORS pair is defined when the entries does not overlap in their
 * start/end times.
 */
function isPossibleCorsPair(
  maybePreflight: PerformanceResourceTiming,
  maybeMainRequest: PerformanceResourceTiming
): boolean {
  // We can be sure that `maybePreflight` startTime is less than
  // `maybeMainRequest` startTime because of the sorting done by
  // `getEntriesByType`. Thus, to check the timings do not overlap, the
  // maybePreflight.respondeEnd must be less than maybeMainRequest.startTime.
  return maybePreflight.responseEnd < maybeMainRequest.startTime;
}
