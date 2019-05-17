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

import * as webTypes from '@opencensus/web-types';
import { randomTraceId } from '../../common/id-util';
import { Span } from './span';

/** Simple mock root span for use in use tests. */
export class RootSpan extends Span {
  constructor(
    /** Trace associated with this root span. */
    private readonly tracer: webTypes.TracerBase,
    /** A trace options object to build the root span. */
    context?: webTypes.TraceOptions
  ) {
    super();

    if (context) {
      this.name = context.name;
      this.kind = context.kind || webTypes.SpanKind.UNSPECIFIED;

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

  start() {
    super.start();
    this.tracer.onStartSpan(this);
  }

  end() {
    super.end();
    this.tracer.onEndSpan(this);
  }
}
