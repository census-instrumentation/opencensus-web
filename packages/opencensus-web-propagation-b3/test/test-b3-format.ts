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
import { B3Format, X_B3_TRACE_ID, X_B3_SPAN_ID, X_B3_SAMPLED } from '../src';

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

describe('B3Format', () => {
  let headers: FakeHeaders;
  const b3format = new B3Format();

  beforeEach(() => {
    headers = new FakeHeaders();
  });

  describe('extract', () => {
    it('extracts traceId, spanId and options from b3 headers', () => {
      headers.setHeader(X_B3_TRACE_ID, '0af7651916cd43dd8448eb211c80319c');
      headers.setHeader(X_B3_SPAN_ID, 'b7ad6b7169203331');

      expect(b3format.extract(headers)).toEqual({
        traceId: '0af7651916cd43dd8448eb211c80319c',
        spanId: 'b7ad6b7169203331',
        options: 0,
      });
    });

    it('returns null if b3 header is missing', () => {
      expect(b3format.extract(headers)).toEqual(null);
    });

    it('returns null if b3 header is invalid', () => {
      headers.setHeader(X_B3_TRACE_ID, 'invalid!');
      headers.setHeader(X_B3_SPAN_ID, '');
      expect(b3format.extract(headers)).toEqual(null);
    });

    it('extracts options from b3 headers', () => {
      headers.setHeader(X_B3_TRACE_ID, '0af7651916cd43dd8448eb211c80319c');
      headers.setHeader(X_B3_SPAN_ID, 'b7ad6b7169203331');
      headers.setHeader(X_B3_SAMPLED, '01');
      expect(b3format.extract(headers)).toEqual({
        traceId: '0af7651916cd43dd8448eb211c80319c',
        spanId: 'b7ad6b7169203331',
        options: 0x1,
      });
    });
  });

  describe('inject', () => {
    it('sets b3 headers', () => {
      b3format.inject(headers, {
        traceId: '0af7651916cd43dd8448eb211c80319c',
        spanId: 'b7ad6b7169203331',
        options: 0x1,
      });
      expect(headers.getHeader(X_B3_TRACE_ID)).toBe(
        '0af7651916cd43dd8448eb211c80319c'
      );
      expect(headers.getHeader(X_B3_SPAN_ID)).toBe('b7ad6b7169203331');
      expect(headers.getHeader(X_B3_SAMPLED)).toBe('1');
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
        const spanContext = b3format.generate();
        expect(spanContext.traceId).toMatch(TRACE_ID_REGEX);
        expect(spanContext.spanId).toMatch(SPAN_ID_REGEX);
        traceIds.add(spanContext.traceId);
        spanIds.add(spanContext.spanId);
      }
      // Test trace/span IDs for uniqueness.
      expect(traceIds.size).toBe(trials);
      expect(spanIds.size).toBe(trials);
    });
  });
});
