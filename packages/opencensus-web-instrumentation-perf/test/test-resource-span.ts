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

import {SpanKind} from '@opencensus/web-core';
import {PerformanceResourceTimingExtended} from '../src/perf-types';
import {getResourceSpan} from '../src/resource-span';

const SPAN_ID_REGEX = /[0-9a-f]{16}/;
const USER_AGENT = 'Mozilla/5.0 TEST';
const TRACE_ID = '00000000000000000000000000000001';
const PARENT_SPAN_ID = '000000000000000a';

describe('getResourceSpan', () => {
  beforeEach(() => {
    spyOnProperty(navigator, 'userAgent').and.returnValue(USER_AGENT);
  });

  it('generates span for resource timing without detailed timestamps', () => {
    // This is similar to what a resource timing looks like from a different
    // origin without the `Timing-Allow-Origin`:
    // See: https://w3c.github.io/resource-timing/#sec-cross-origin-resources
    const resourceTimingWithoutDetails: PerformanceResourceTimingExtended = {
      connectEnd: 0,
      connectStart: 0,
      decodedBodySize: 0,
      domainLookupEnd: 0,
      domainLookupStart: 0,
      duration: 13.1,
      encodedBodySize: 0,
      entryType: 'resource',
      fetchStart: 266.9,
      initiatorType: 'link',  // Implies GET method
      name: 'http://localhost:4200/style.css',
      nextHopProtocol: 'h2',
      redirectEnd: 0,
      redirectStart: 0,
      redirectCount: 0,
      requestStart: 0,
      responseEnd: 280.1,
      responseStart: 0,
      secureConnectionStart: 0,
      serverTiming: [],
      startTime: 266.9,
      transferSize: 0,
      workerStart: 0,
      toJSON: () => ({}),
    };

    const span =
        getResourceSpan(resourceTimingWithoutDetails, TRACE_ID, PARENT_SPAN_ID);
    expect(span.id).toMatch(SPAN_ID_REGEX);
    expect(span.traceId).toBe(TRACE_ID);
    expect(span.parentSpanId).toBe(PARENT_SPAN_ID);
    expect(span.name).toBe('/style.css');
    expect(span.kind).toBe(SpanKind.CLIENT);
    expect(span.startPerfTime).toBe(resourceTimingWithoutDetails.startTime);
    expect(span.endPerfTime).toBe(resourceTimingWithoutDetails.responseEnd);
    expect(span.annotations).toEqual([
      {timestamp: 266.9, description: 'fetchStart', attributes: {}},
      {timestamp: 280.1, description: 'responseEnd', attributes: {}},
    ]);
    expect(span.attributes).toEqual({
      'http.host': 'localhost:4200',
      'http.user_agent': 'Mozilla/5.0 TEST',
      'http.next_hop_protocol': 'h2',
      'http.method': 'GET',
      'http.path': '/style.css',
      'http.initiator_type': 'link',
      'http.url': 'http://localhost:4200/style.css',
    });
  });

  it('generates events for resource timing with detailed timestamps', () => {
    // This is similar to what a resource timing from the same origin.
    const resourceTimingWithDetails: PerformanceResourceTimingExtended = {
      startTime: 1,
      fetchStart: 1,
      domainLookupStart: 2,
      domainLookupEnd: 3,
      connectStart: 4,
      connectEnd: 5,
      secureConnectionStart: 6,
      redirectStart: 7,
      redirectEnd: 8,
      requestStart: 9,
      responseStart: 100,
      responseEnd: 11,
      duration: 11,
      transferSize: 1300,
      encodedBodySize: 1100,
      decodedBodySize: 1000,
      entryType: 'xmlhttprequest',  // May not be a GET
      initiatorType: 'link',
      name: 'http://localhost:4200/style.css',
      nextHopProtocol: 'h2',
      serverTiming: [],
      workerStart: 0,
      toJSON: () => ({}),
    };

    const span =
        getResourceSpan(resourceTimingWithDetails, TRACE_ID, PARENT_SPAN_ID);
    expect(span.id).toMatch(SPAN_ID_REGEX);
    expect(span.annotations).toEqual([
      {timestamp: 1, description: 'fetchStart', attributes: {}},
      {timestamp: 2, description: 'domainLookupStart', attributes: {}},
      {timestamp: 3, description: 'domainLookupEnd', attributes: {}},
      {timestamp: 4, description: 'connectStart', attributes: {}},
      {timestamp: 5, description: 'connectEnd', attributes: {}},
      {
        timestamp: 6,
        description: 'secureConnectionStart',
        attributes: {},
      },
      {timestamp: 7, description: 'redirectStart', attributes: {}},
      {timestamp: 8, description: 'redirectEnd', attributes: {}},
      {timestamp: 9, description: 'requestStart', attributes: {}},
      {timestamp: 100, description: 'responseStart', attributes: {}},
      {timestamp: 11, description: 'responseEnd', attributes: {}},
    ]);
    expect(span.attributes).toEqual({
      'http.url': 'http://localhost:4200/style.css',
      'http.host': 'localhost:4200',
      'http.path': '/style.css',
      'http.user_agent': 'Mozilla/5.0 TEST',
      'http.next_hop_protocol': 'h2',
      'http.method': 'GET',
      'http.initiator_type': 'link',
      'http.resp_size': 1300,
      'http.resp_encoded_body_size': 1100,
      'http.resp_decoded_body_size': 1000,
    });
  });
});
