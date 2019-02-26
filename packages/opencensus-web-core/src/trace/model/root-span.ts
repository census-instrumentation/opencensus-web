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

import * as coreTypes from '@opencensus/core';
import {randomTraceId} from '../../internal/util';
import {SpanKind} from './enums';
import {Span} from './span';

/** Simple mock root span for use in use tests. */
export class RootSpan extends Span implements coreTypes.RootSpan {
  /** A list of child spans. */
  spans: Span[] = [];

  constructor(
      /** Trace associated with this root span. */
      private readonly tracer: coreTypes.Tracer,
      /** A trace options object to build the root span. */
      context?: coreTypes.TraceOptions) {
    super();

    if (context) {
      this.name = context.name;
      this.kind = context.kind || SpanKind.UNSPECIFIED;

      const spanContext = context.spanContext;
      if (spanContext) {
        this.parentSpanId = spanContext.spanId || '';
        this.traceId = spanContext.traceId;
        this.traceState = spanContext.traceState || '';
      }
    } else {
      this.traceId = randomTraceId();
    }
  }

  /**
   * Starts a new child span in the root span.
   * @param nameOrOptions Span name string or object with `name` and `kind`
   * @param kind Span kind if not using options object.
   */
  startChildSpan(
      nameOrOptions?: string|{name: string, kind: SpanKind},
      kind?: SpanKind): Span {
    const child = new Span();
    child.traceId = this.traceId;
    child.traceState = this.traceState;

    const spanName =
        typeof nameOrOptions === 'object' ? nameOrOptions.name : nameOrOptions;
    const spanKind =
        typeof nameOrOptions === 'object' ? nameOrOptions.kind : kind;
    if (spanName) child.name = spanName;
    if (spanKind) child.kind = spanKind;

    child.start();
    child.parentSpanId = this.id;
    this.spans.push(child);
    return child;
  }

  start() {
    super.start();
    this.tracer.onStartSpan(this);
  }

  end() {
    super.end();
    this.tracer.onEndSpan(this);
  }
}
