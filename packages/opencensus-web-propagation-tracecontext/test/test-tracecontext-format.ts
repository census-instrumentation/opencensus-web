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

import { HeaderGetter, HeaderSetter } from '@opencensus/web-core';

import {
  spanContextToTraceParent,
  TraceContextFormat,
  traceParentToSpanContext,
} from '../src/';

type HeaderValue = string | string[];

class FakeHeaders implements HeaderSetter, HeaderGetter {
  private readonly headers = new Map<string, HeaderValue>();

  getHeader(header: string): HeaderValue | undefined {
    return this.headers.get(header);
  }

  setHeader(header: string, value: HeaderValue) {
    this.headers.set(header, value);
  }
}

describe('traceParentToSpanContext', () => {
  it('returns null for invalid trace headers', () => {
    expect(traceParentToSpanContext('totally invalid header!')).toBe(null);
    expect(traceParentToSpanContext('1f-2f-3f-4f')).toBe(null);
    // Trace IDs with all zeros are invalid.
    expect(
      traceParentToSpanContext(
        '00-00000000000000000000000000000000-b7ad6b7169203331-01'
      )
    ).toBe(null);
  });

  it('extracts traceId, spanId and options for valid header', () => {
    expect(
      traceParentToSpanContext(
        '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01'
      )
    ).toEqual({
      traceId: '0af7651916cd43dd8448eb211c80319c',
      spanId: 'b7ad6b7169203331',
      options: 0x1,
    });
  });
});

describe('spanContextToTraceParent', () => {
  it('formats traceId, spanId and options into header', () => {
    expect(
      spanContextToTraceParent({
        traceId: '0af7651916cd43dd8448eb211c80319c',
        spanId: 'b7ad6b7169203331',
        options: 0x1,
      })
    ).toBe('00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01');
  });
});

describe('TraceContextFormat', () => {
  let headers: FakeHeaders;
  const traceContextFormat = new TraceContextFormat();

  beforeEach(() => {
    headers = new FakeHeaders();
  });

  describe('extract', () => {
    it('extracts traceId, spanId and options from traceparent header', () => {
      headers.setHeader(
        'traceparent',
        '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01'
      );
      expect(traceContextFormat.extract(headers)).toEqual({
        traceId: '0af7651916cd43dd8448eb211c80319c',
        spanId: 'b7ad6b7169203331',
        options: 0x1,
      });
    });

    it('returns null if traceparent header is missing', () => {
      expect(traceContextFormat.extract(headers)).toEqual(null);
    });

    it('returns null if traceparent header is invalid', () => {
      headers.setHeader('traceparent', 'invalid!');
      expect(traceContextFormat.extract(headers)).toEqual(null);
    });

    it('extracts tracestate from header', () => {
      headers.setHeader(
        'traceparent',
        '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01'
      );
      headers.setHeader('tracestate', 'a=b');
      expect(traceContextFormat.extract(headers)).toEqual({
        traceId: '0af7651916cd43dd8448eb211c80319c',
        spanId: 'b7ad6b7169203331',
        options: 0x1,
        traceState: 'a=b',
      });
    });

    it('combines multiple tracestate headers', () => {
      headers.setHeader(
        'traceparent',
        '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-00'
      );
      headers.setHeader('tracestate', ['a=b', 'c=d']);
      expect(traceContextFormat.extract(headers)).toEqual({
        traceId: '0af7651916cd43dd8448eb211c80319c',
        spanId: 'b7ad6b7169203331',
        options: 0x0,
        traceState: 'a=b,c=d',
      });
    });
  });

  describe('inject', () => {
    it('sets traceparent header', () => {
      traceContextFormat.inject(headers, {
        traceId: '0af7651916cd43dd8448eb211c80319c',
        spanId: 'b7ad6b7169203331',
        options: 0x1,
      });
      expect(headers.getHeader('traceparent')).toBe(
        '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01'
      );
    });

    it('sets tracestate header if tracestate specified', () => {
      traceContextFormat.inject(headers, {
        traceId: '0af7651916cd43dd8448eb211c80319c',
        spanId: 'b7ad6b7169203331',
        options: 0x1,
        traceState: 'a=b',
      });
      expect(headers.getHeader('traceparent')).toBe(
        '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01'
      );
      expect(headers.getHeader('tracestate')).toBe('a=b');
    });
  });

  describe('generate', () => {
    const SPAN_ID_REGEX = /[0-9a-f]{16}/;
    const TRACE_ID_REGEX = /[0-9a-f]{32}/;

    it('generates unique and valid trace and span IDs', () => {
      const trials = 20;
      const traceIds = new Set<string>();
      const spanIds = new Set<string>();
      for (let i = 0; i < trials; i++) {
        const spanContext = traceContextFormat.generate();
        expect(spanContext.traceId).toMatch(TRACE_ID_REGEX);
        expect(spanContext.spanId).toMatch(SPAN_ID_REGEX);
        traceIds.add(spanContext.traceId);
        spanIds.add(spanContext.spanId);
        expect(spanContext.traceState).toBe(undefined);
        expect(spanContext.options).toBe(0x0);
      }
      // Test trace/span IDs for uniqueness.
      expect(traceIds.size).toBe(trials);
      expect(spanIds.size).toBe(trials);
    });
  });
});
