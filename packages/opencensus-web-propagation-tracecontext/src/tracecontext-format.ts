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

import {HeaderGetter, HeaderSetter, Propagation, randomSpanId, randomTraceId, SpanContext} from '@opencensus/web-core';

/**
 * @fileoverview Utilities to serialize/deserialize trace context (trace ID,
 * span ID, trace options and optional trace state) to and from the trace
 * context `traceparent` and `tracestate` headers.
 * See https://www.w3.org/TR/trace-context/ for details about the Trace Context
 * header format.
 */

/** The default trace options. This defaults to unsampled. */
const DEFAULT_OPTIONS = 0x0;

/** The traceparent header key. */
const TRACE_PARENT = 'traceparent';
/** The tracestate header key. */
const TRACE_STATE = 'tracestate';
/** Regular expression that represents a valid traceparent header. */
const TRACE_PARENT_REGEX = /^[\da-f]{2}-[\da-f]{32}-[\da-f]{16}-[\da-f]{2}$/;

/**
 * Parses a traceparent header value into a SpanContext object, or null if the
 * traceparent value is invalid.
 */
export function traceParentToSpanContext(traceParent: string): SpanContext|
    null {
  const match = traceParent.match(TRACE_PARENT_REGEX);
  if (!match) return null;
  const parts = traceParent.split('-');
  const traceId = parts[1];
  if (traceId.match(/^0*$/)) return null;  // All zeros trace ID is invalid.
  const spanId = parts[2];
  // tslint:disable-next-line:ban Needed to parse hexadecimal.
  const options = parseInt(parts[3], 16);
  return {traceId, spanId, options};
}

/**
 * Converts a SpanContext object to a traceparent header value. This assumes
 * that the length of the `traceId`, `spanId` and `options` are all valid.
 */
export function spanContextToTraceParent(spanContext: SpanContext): string {
  return `00-${spanContext.traceId}-${spanContext.spanId}-0${
      (spanContext.options || DEFAULT_OPTIONS).toString(16)}`;
}

/**
 * Propagates span context through Trace Context format propagation.
 *
 * Based on the Trace Context specification:
 * https://www.w3.org/TR/trace-context/
 */
export class TraceContextFormat implements Propagation {
  /**
   * Gets the trace context from a request headers. If there is no trace context
   * in the headers, or if the parsed `traceId` or `spanId` is invalid, null
   * returned.
   */
  extract(getter: HeaderGetter): SpanContext|null {
    const traceParentHeader = getter.getHeader(TRACE_PARENT);
    if (!traceParentHeader) return null;
    const traceParent = Array.isArray(traceParentHeader) ?
        traceParentHeader[0] :
        traceParentHeader;
    const spanContext = traceParentToSpanContext(traceParent);
    if (!spanContext) return null;

    const traceStateHeader = getter.getHeader(TRACE_STATE);
    if (traceStateHeader) {
      spanContext.traceState = Array.isArray(traceStateHeader) ?
          traceStateHeader.join(',') :
          traceStateHeader;
    }
    return spanContext;
  }

  /**
   * Adds a trace context `traceparent` and `tracestate` (if set in
   * `spanContext`) to the request headers.
   */
  inject(setter: HeaderSetter, spanContext: SpanContext): void {
    setter.setHeader(TRACE_PARENT, spanContextToTraceParent(spanContext));
    if (spanContext.traceState) {
      setter.setHeader(TRACE_STATE, spanContext.traceState);
    }
  }

  /**
   * Generate SpanContext.
   *
   * Context parts are based on section 2.2.2 of TraceContext spec.
   */
  generate(): SpanContext {
    return {
      traceId: randomTraceId(),
      spanId: randomSpanId(),
      options: DEFAULT_OPTIONS,
    };
  }
}
