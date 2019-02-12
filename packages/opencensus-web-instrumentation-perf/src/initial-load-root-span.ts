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

import {Annotation, ATTRIBUTE_HTTP_URL, ATTRIBUTE_HTTP_USER_AGENT, ATTRIBUTE_LONG_TASK_ATTRIBUTION, ATTRIBUTE_NAV_TYPE, parseUrl, RootSpan, Span, Tracer} from '@opencensus/web-core';
import {GroupedPerfEntries} from './perf-recorder';
import {PerformanceLongTaskTiming, PerformanceNavigationTimingExtended} from './perf-types';
import {getResourceSpan} from './resource-span';
import {annotationsForPerfTimeFields} from './util';

/**
 * These are properties of PerformanceNavigationTiming that will be turned
 * into span annotations on the navigation span.
 */
const NAVIGATION_TIMING_EVENTS = [
  'domLoading',
  'domInteractive',
  'domContentLoaded',
  'domComplete',
  'loadEventStart',
  'loadEventEnd',
  'unloadEventStart',
  'unloadEventEnd',
];

/**
 * Returns a root span for the initial page load along with child spans for
 * resource timings and long tasks that were part of the load. The root span
 * represents the full time between when the navigation was initiated in the
 * browser to when the `load` event fires.
 * @param tracer The tracer to associate the root span with
 * @param perfEntries Performance timing entries grouped by type. These should
 *     include the entries up to soon after the `load` browser event fires.
 * @param navigationFetchSpanId This is the ID for the span that represents the
 *     HTTP request to get the initial HTML. This should be sent back from the
 *     server to enable linking the server and client side spans for the initial
 *     HTML fetch.
 * @param traceId The trace ID that all spans returned should have. This should
 *     also be specified by the server to enable linking between the server and
 *     client spans for the initial HTML fetch.
 */
export function getInitialLoadRootSpan(
    tracer: Tracer, perfEntries: GroupedPerfEntries,
    navigationFetchSpanId: string, traceId: string): RootSpan {
  const navTiming = perfEntries.navigationTiming;
  const navigationUrl = navTiming ? navTiming.name : location.href;
  const parsedNavigationUrl = parseUrl(navigationUrl);
  const navigationPath = parsedNavigationUrl.pathname;
  const root = new RootSpan(
      tracer,
      {name: `Nav.${navigationPath}`, spanContext: {spanId: '', traceId}});
  root.startPerfTime = 0;
  root.annotations = getNavigationAnnotations(perfEntries);
  root.attributes[ATTRIBUTE_HTTP_URL] = navigationUrl;
  root.attributes[ATTRIBUTE_HTTP_USER_AGENT] = navigator.userAgent;

  if (navTiming) {
    root.endPerfTime = navTiming.loadEventEnd;
    root.attributes[ATTRIBUTE_NAV_TYPE] = navTiming.type;
    const navFetchSpan =
        getNavigationFetchSpan(navTiming, navigationUrl, navigationFetchSpanId);
    root.spans.push(navFetchSpan);
  }

  const resourceSpans = perfEntries.resourceTimings.map(getResourceSpan);
  const longTaskSpans = perfEntries.longTasks.map(getLongTaskSpan);

  root.spans = root.spans.concat(resourceSpans, longTaskSpans);
  for (const span of root.spans) {
    span.traceId = traceId;
    span.parentSpanId = root.id;
  }
  return root;
}

/** Returns a parent span for the HTTP request to retrieve the initial HTML. */
function getNavigationFetchSpan(
    navigationTiming: PerformanceNavigationTimingExtended,
    navigationName: string, navigationFetchSpanId: string): Span {
  const span = getResourceSpan(navigationTiming);
  span.id = navigationFetchSpanId;
  span.startPerfTime = navigationTiming.fetchStart;
  return span;
}

/** Formats a performance long task event as a span. */
function getLongTaskSpan(longTask: PerformanceLongTaskTiming): Span {
  const span = new Span();
  span.name = 'Long JS task';
  span.startPerfTime = longTask.startTime;
  span.endPerfTime = longTask.startTime + longTask.duration;
  span.attributes[ATTRIBUTE_LONG_TASK_ATTRIBUTION] =
      JSON.stringify(longTask.attribution);
  return span;
}

/** Gets annotations for a navigation span including paint timings. */
function getNavigationAnnotations(perfEntries: GroupedPerfEntries):
    Annotation[] {
  const navigation = perfEntries.navigationTiming;
  if (!navigation) return [];

  const navAnnotations =
      annotationsForPerfTimeFields(navigation, NAVIGATION_TIMING_EVENTS);

  for (const paintTiming of perfEntries.paintTimings) {
    navAnnotations.push({
      timestamp: paintTiming.startTime,
      description: paintTiming.name,
      attributes: {},
    });
  }
  return navAnnotations;
}
