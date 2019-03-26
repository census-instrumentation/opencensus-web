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

import {getInitialLoadSpanContext} from '../src/initial-load-context';
import {WindowWithOcwGlobals} from '../src/types';

const windowWithOcwGlobals = window as WindowWithOcwGlobals;

const SPAN_ID_REGEX = /[0-9a-f]{16}/;
const TRACE_ID_REGEX = /[0-9a-f]{32}/;

describe('getInitialLoadSpanContext', () => {
  let realTraceparent: string|undefined;
  beforeEach(() => {
    realTraceparent = windowWithOcwGlobals.traceparent;
  });
  afterEach(() => {
    windowWithOcwGlobals.traceparent = realTraceparent;
  });

  it('sets trace and span ID from global `traceparent` when specified', () => {
    windowWithOcwGlobals.traceparent =
        `00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-00`;
    expect(getInitialLoadSpanContext()).toEqual({
      traceId: '0af7651916cd43dd8448eb211c80319c',
      spanId: 'b7ad6b7169203331',
      options: 0,
    });
  });

  it('generates a new random span context if `traceparent` unspecified', () => {
    windowWithOcwGlobals.traceparent = undefined;
    const spanContext = getInitialLoadSpanContext();
    expect(spanContext.traceId).toMatch(TRACE_ID_REGEX);
    expect(spanContext.spanId).toMatch(SPAN_ID_REGEX);
    expect(spanContext.options).toBe(1);
  });

  it('generates a new random span context if `traceparent` is invalid', () => {
    windowWithOcwGlobals.traceparent = 'invalid trace parent header!';
    const spanContext = getInitialLoadSpanContext();
    expect(spanContext.traceId).toMatch(TRACE_ID_REGEX);
    expect(spanContext.spanId).toMatch(SPAN_ID_REGEX);
    expect(spanContext.options).toBe(1);
  });
});
