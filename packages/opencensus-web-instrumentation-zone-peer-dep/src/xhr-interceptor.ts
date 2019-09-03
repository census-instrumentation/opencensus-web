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

import { AsyncTask, XhrWithOcWebData } from './zone-types';
import {
  RootSpan,
  Span,
  ATTRIBUTE_HTTP_STATUS_CODE,
  ATTRIBUTE_HTTP_METHOD,
  parseUrl,
  SpanKind,
  Propagation,
} from '@opencensus/web-core';
import { getXhrPerfomanceData } from './perf-resource-timing-selector';
import { traceOriginMatchesOrSameOrigin, isTracingZone } from './util';
import { TraceContextFormat } from '@opencensus/web-propagation-tracecontext';
import {
  annotationsForPerfTimeFields,
  PerformanceResourceTimingExtended,
  PERFORMANCE_ENTRY_EVENTS,
  getResourceSpan,
} from '@opencensus/web-instrumentation-perf';

/**
 * Map intended to keep track of current XHR objects associated to a span.
 */
const xhrSpans = new Map<XhrWithOcWebData, Span>();

// Keeps track of the current xhr tasks that are running. This is
// useful to clear the Performance Resource Timing entries when no
// xhr tasks are being intercepted.
let xhrTasksCount = 0;

/**
 * Set to keep track of already assigned performance resource entries to a span.
 * This is done as there might be some edge cases where the result might include
 * some already assigned entries.
 */
export const alreadyAssignedPerfEntries = new Set<PerformanceResourceTiming>();

/**
 * Intercepts task as XHR if it is a tracked task and its target object is
 * instance of `XMLHttpRequest`.
 * In case the task is intercepted, sets the Trace Context Header to it and
 * creates a child span related to this XHR in case it is OPENED and `send()`
 * has been called.
 * In case the XHR is DONE, end the child span.
 */
export function interceptXhrTask(
  task: AsyncTask,
  propagation: Propagation = new TraceContextFormat()
): void {
  if (!isTracingZone(task.zone)) return;
  if (!(task.target instanceof XMLHttpRequest)) return;

  const xhr = task.target as XhrWithOcWebData;
  if (xhr.readyState === XMLHttpRequest.OPENED && xhr._ocweb_has_called_send) {
    // Only generate the XHR and send the tracer if it is OPENED and the
    // `send()` method has beend called.
    // This avoids associating the wrong performance resource timing entries
    // to the XHR when `send()` is not called right after `open()` is called.
    // This is because there might be a long gap between `open()` and `send()`
    // methods are called, and within this gap there might be other HTTP
    // requests causing more entries to the Performance Resource buffer.
    incrementXhrTaskCount();
    const rootSpan: RootSpan = task.zone.get('data').rootSpan;
    setTraceparentContextHeader(xhr, rootSpan, propagation);
  } else if (xhr.readyState === XMLHttpRequest.DONE) {
    endXhrSpan(xhr);
    decrementXhrTaskCount();
  }
}

function setTraceparentContextHeader(
  xhr: XhrWithOcWebData,
  rootSpan: RootSpan,
  propagation: Propagation
): void {
  // `__zone_symbol__xhrURL` is set by the Zone monkey-path.
  const xhrUrl = xhr.__zone_symbol__xhrURL;
  const childSpan: Span = rootSpan.startChildSpan({
    name: parseUrl(xhrUrl).pathname,
    kind: SpanKind.CLIENT,
  });
  // Associate the child span to the XHR so it allows to
  // find the correct span when the request is DONE.
  xhrSpans.set(xhr, childSpan);
  if (traceOriginMatchesOrSameOrigin(xhrUrl)) {
    const setter = {
      setHeader(name: string, value: string) {
        xhr.setRequestHeader(name, value);
      },
    };

    propagation.inject(setter, {
      traceId: rootSpan.traceId,
      spanId: childSpan.id,
      // As the interaction tracker has started, all traces are sampled.
      options: 1,
    });
  }
}

function endXhrSpan(xhr: XhrWithOcWebData): void {
  const span = xhrSpans.get(xhr);
  if (span) {
    // TODO: Investigate more to send the the status code a `number` rather
    // than `string`. Once it is able to send as a number, change it.
    span.addAttribute(ATTRIBUTE_HTTP_STATUS_CODE, xhr.status.toString());
    span.addAttribute(ATTRIBUTE_HTTP_METHOD, xhr._ocweb_method);
    span.end();
    joinPerfResourceDataToSpan(xhr, span);
    xhrSpans.delete(xhr);
  }
}

/**
 * If xhr task count is 0, clear the Performance Resource Timings.
 * This is done in order to help the browser Performance resource timings
 * selector algorithm to take only the data related to the current XHRs running.
 */
function maybeClearPerfResourceBuffer(): void {
  if (xhrTasksCount === 0) {
    performance.clearResourceTimings();
    // Clear the set as these entries are not longer necessary.
    alreadyAssignedPerfEntries.clear();
  }
}

function joinPerfResourceDataToSpan(xhr: XhrWithOcWebData, span: Span) {
  const xhrPerfResourceTiming = getXhrPerfomanceData(xhr.responseURL, span);
  if (!xhrPerfResourceTiming) return;

  alreadyAssignedPerfEntries.add(xhrPerfResourceTiming.mainRequest);
  if (xhrPerfResourceTiming.corsPreFlightRequest) {
    alreadyAssignedPerfEntries.add(xhrPerfResourceTiming.corsPreFlightRequest);
    const corsPerfTiming = xhrPerfResourceTiming.corsPreFlightRequest as PerformanceResourceTimingExtended;
    setCorsPerfTimingAsChildSpan(corsPerfTiming, span);
  }
  span.annotations = annotationsForPerfTimeFields(
    xhrPerfResourceTiming.mainRequest as PerformanceResourceTimingExtended,
    PERFORMANCE_ENTRY_EVENTS
  );
}

function setCorsPerfTimingAsChildSpan(
  performanceTiming: PerformanceResourceTimingExtended,
  span: Span
): void {
  const corsSpan = getResourceSpan(performanceTiming, span.traceId, span.id);
  corsSpan.name = 'CORS Preflight';
  span.spans.push(corsSpan);
}

function incrementXhrTaskCount(): void {
  xhrTasksCount++;
}

function decrementXhrTaskCount(): void {
  // Check the xhr tasks count should be greater than 0 to avoid do negative
  // counting. However, this case should never happen, this is just to make
  // clear it is not possible to happen.
  if (xhrTasksCount > 0) xhrTasksCount--;
  maybeClearPerfResourceBuffer();
}
