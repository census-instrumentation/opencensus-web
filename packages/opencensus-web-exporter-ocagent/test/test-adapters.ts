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
import * as webTypes from '@opencensus/web-core';
import {adaptRootSpan} from '../src/adapters';
import * as apiTypes from '../src/api-types';
import {MockRootSpan, MockSpan} from './mock-trace-types';

describe('Core to API Span adapters', () => {
  it('adapts @opencensus/core span to grpc-gateway properties', () => {
    const coreRootSpan: coreTypes.RootSpan = new MockRootSpan(
        {
          id: 'a56a50b90c653f00',
          traceId: '69f223f58668171cedf0c9eab06f0d36',
          parentSpanId: 'b56a50b90c653f00',
          name: 'test1',
          kind: 'SERVER',
          startTime: new Date(1535683887003),
          endTime: new Date(1535683887005),
          attributes: {
            'a': 'abc',
            'b': 123,
            'c': false,
            'd': 1.1,
            'e': NaN,
            'f': -5000,
          },
          annotations: [{
            description: 'annotation1',
            timestamp: 1535683887009.5,
            attributes: {'xyz': 999},
          }],
          links: [{
            traceId: '79f223f58668171cedf0c9eab06f0d36',
            spanId: 'b56a50b90c653f00',
            type: 'CHILD_LINKED_SPAN',
            attributes: {
              'd': 'def',
              'e': 456,
              'f': true,
            },
          }],
          status: 404,
        },
        []);

    const expectedApiSpan: apiTypes.Span = {
      traceId: 'afIj9YZoFxzt8MnqsG8NNg==',
      spanId: 'pWpQuQxlPwA=',
      parentSpanId: 'tWpQuQxlPwA=',
      name: {value: 'test1'},
      kind: apiTypes.SpanKind.SERVER,
      startTime: '2018-08-31T02:51:27.003Z',
      endTime: '2018-08-31T02:51:27.005Z',
      attributes: {
        attributeMap: {
          'a': {stringValue: {value: 'abc'}},
          'b': {doubleValue: 123},
          'c': {boolValue: false},
          'd': {doubleValue: 1.1},
          'e': {doubleValue: NaN},
          'f': {doubleValue: -5000},
        },
      },
      timeEvents: {
        timeEvent: [
          {
            time: '2018-08-31T02:51:27.009Z',
            annotation: {
              description: {value: 'annotation1'},
              attributes: {attributeMap: {'xyz': {doubleValue: 999}}},
            },
          },
        ],
      },
      links: {
        link: [{
          traceId: 'efIj9YZoFxzt8MnqsG8NNg==',
          spanId: 'tWpQuQxlPwA=',
          type: apiTypes.LinkType.CHILD_LINKED_SPAN,
          attributes: {
            attributeMap: {
              'd': {stringValue: {value: 'def'}},
              'e': {doubleValue: 456},
              'f': {boolValue: true},
            },
          },
        }],
      },
      status: {code: 404},
      sameProcessAsParentSpan: true,
      tracestate: {},
    };

    const apiSpans = adaptRootSpan(coreRootSpan);

    expect(apiSpans.length).toBe(1);
    expect(apiSpans[0]).toEqual(expectedApiSpan);
  });

  it('adapts child spans of the root span', () => {
    const coreRootSpan: coreTypes.RootSpan = new MockRootSpan(
        {
          id: 'a66a50b90c653f00',
          traceId: '89f223f58668171cedf0c9eab06f0d36',
          name: 'root',
          startTime: new Date(1535683887001),
          endTime: new Date(1535683887009),
        },
        [new MockSpan({
          parentSpanId: 'a66a50b90c653f00',
          id: 'c66a50b90c653f00',
          traceId: '89f223f58668171cedf0c9eab06f0d36',
          name: 'child',
          startTime: new Date(1535683887003),
          endTime: new Date(1535683887005),
        })]);

    const apiSpans = adaptRootSpan(coreRootSpan);

    const expectedApiSpans: apiTypes.Span[] = [
      {
        traceId: 'ifIj9YZoFxzt8MnqsG8NNg==',
        spanId: 'pmpQuQxlPwA=',
        tracestate: {},
        parentSpanId: '',
        name: {value: 'root'},
        kind: apiTypes.SpanKind.UNSPECIFIED,
        startTime: '2018-08-31T02:51:27.001Z',
        endTime: '2018-08-31T02:51:27.009Z',
        attributes: {attributeMap: {}},
        timeEvents: {timeEvent: []},
        sameProcessAsParentSpan: true,
        links: {link: []},
        status: {},
      },
      {
        traceId: 'ifIj9YZoFxzt8MnqsG8NNg==',
        spanId: 'xmpQuQxlPwA=',
        tracestate: {},
        parentSpanId: 'pmpQuQxlPwA=',
        name: {value: 'child'},
        kind: apiTypes.SpanKind.UNSPECIFIED,
        startTime: '2018-08-31T02:51:27.003Z',
        endTime: '2018-08-31T02:51:27.005Z',
        attributes: {attributeMap: {}},
        timeEvents: {timeEvent: []},
        sameProcessAsParentSpan: true,
        links: {link: []},
        status: {},
      },
    ];
    expect(apiSpans).toEqual(expectedApiSpans);
  });

  it('adapts perf times of web spans as high-res timestamps', () => {
    spyOnProperty(performance, 'timeOrigin').and.returnValue(1548000000000);
    const tracer = new webTypes.Tracer();
    const webSpan1 = new webTypes.Span();
    webSpan1.id = '000000000000000a';
    webSpan1.traceId = '00000000000000000000000000000001';
    webSpan1.startPerfTime = 10.1;
    webSpan1.endPerfTime = 20.113;
    const webRootSpan = new webTypes.RootSpan(tracer);
    webRootSpan.spans = [webSpan1];
    webRootSpan.startPerfTime = 5.001;
    webRootSpan.endPerfTime = 30.000001;
    webRootSpan.id = '000000000000000b';
    webRootSpan.traceId = '00000000000000000000000000000001';

    const apiSpans = adaptRootSpan(webRootSpan);

    const expectedApiSpans: apiTypes.Span[] = [
      {
        traceId: 'AAAAAAAAAAAAAAAAAAAAAQ==',
        spanId: 'AAAAAAAAAAs=',
        tracestate: {},
        parentSpanId: '',
        name: {value: 'unnamed'},
        kind: apiTypes.SpanKind.UNSPECIFIED,
        startTime: '2019-01-20T16:00:00.005001000Z',
        endTime: '2019-01-20T16:00:00.030000001Z',
        attributes: {attributeMap: {}},
        timeEvents: {timeEvent: []},
        links: {link: []},
        status: {},
        sameProcessAsParentSpan: true,
      },
      {
        traceId: 'AAAAAAAAAAAAAAAAAAAAAQ==',
        spanId: 'AAAAAAAAAAo=',
        tracestate: {},
        parentSpanId: '',
        name: {value: 'unnamed'},
        kind: apiTypes.SpanKind.UNSPECIFIED,
        startTime: '2019-01-20T16:00:00.010100000Z',
        endTime: '2019-01-20T16:00:00.020113000Z',
        attributes: {attributeMap: {}},
        timeEvents: {timeEvent: []},
        links: {link: []},
        status: {},
        sameProcessAsParentSpan: true,
      },
    ];
    expect(apiSpans).toEqual(expectedApiSpans);
  });
});
