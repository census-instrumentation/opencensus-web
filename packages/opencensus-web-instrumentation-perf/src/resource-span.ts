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

import * as webCore from '@opencensus/web-core';
import { PerformanceResourceTimingExtended } from './perf-types';
import { annotationsForPerfTimeFields } from './util';

/** PerformanceEntry time event fields to create as span annotations. */
export const PERFORMANCE_ENTRY_EVENTS = [
  'workerStart',
  'fetchStart',
  'domainLookupStart',
  'domainLookupEnd',
  'connectStart',
  'connectEnd',
  'secureConnectionStart',
  'redirectStart',
  'redirectEnd',
  'requestStart',
  'responseStart',
  'responseEnd',
];

/** Returns a `Span` based on a browser performance API resource timing. */
export function getResourceSpan(
  resourceTiming: PerformanceResourceTimingExtended,
  traceId: string,
  parentSpanId: string,
  spanId?: string
): webCore.Span {
  const span = new webCore.Span(spanId);
  span.traceId = traceId;
  span.parentSpanId = parentSpanId;
  const parsedUrl = webCore.parseUrl(resourceTiming.name);
  span.name = parsedUrl.pathname;
  span.startPerfTime = resourceTiming.startTime;
  span.kind = webCore.SpanKind.CLIENT;
  span.endPerfTime = resourceTiming.responseEnd;
  span.attributes = getResourceSpanAttributes(resourceTiming, parsedUrl);
  span.annotations = annotationsForPerfTimeFields(
    resourceTiming,
    PERFORMANCE_ENTRY_EVENTS
  );
  return span;
}

function getResourceSpanAttributes(
  resourceTiming: PerformanceResourceTimingExtended,
  parsedUrl: webCore.ParsedUrl
): webCore.Attributes {
  const attrs: webCore.Attributes = {};
  attrs[webCore.ATTRIBUTE_HTTP_URL] = resourceTiming.name;
  attrs[webCore.ATTRIBUTE_HTTP_HOST] = parsedUrl.host;
  attrs[webCore.ATTRIBUTE_HTTP_PATH] = parsedUrl.pathname;
  attrs[webCore.ATTRIBUTE_HTTP_USER_AGENT] = navigator.userAgent;

  if (resourceTiming.nextHopProtocol) {
    attrs[webCore.ATTRIBUTE_HTTP_NEXT_HOP_PROTOCOL] =
      resourceTiming.nextHopProtocol;
  }

  const initiatorType = resourceTiming.initiatorType;
  if (initiatorType) {
    if (initiatorType !== 'xmlhttprequest' && initiatorType !== 'fetch') {
      attrs[webCore.ATTRIBUTE_HTTP_METHOD] = 'GET';
    }
    attrs[webCore.ATTRIBUTE_HTTP_INITIATOR_TYPE] = initiatorType;
  }

  if (resourceTiming.transferSize) {
    attrs[webCore.ATTRIBUTE_HTTP_RESP_SIZE] = resourceTiming.transferSize;
  }
  if (resourceTiming.encodedBodySize) {
    attrs[webCore.ATTRIBUTE_HTTP_RESP_ENCODED_BODY_SIZE] =
      resourceTiming.encodedBodySize;
  }
  if (resourceTiming.decodedBodySize) {
    attrs[webCore.ATTRIBUTE_HTTP_RESP_DECODED_BODY_SIZE] =
      resourceTiming.decodedBodySize;
  }
  return attrs;
}
