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
import { adaptRootSpan } from '../src/adapters';
import * as apiTypes from '../src/api-types';
import { mockGetterOrValue, restoreGetterOrValue } from './util';

const API_SPAN_KIND_UNSPECIFIED: apiTypes.SpanKindUnspecified = 0;
const API_SPAN_KIND_SERVER: apiTypes.SpanKindServer = 1;
const API_LINK_TYPE_CHILD_LINKED_SPAN: apiTypes.LinkTypeChildLinkedSpan = 1;
const API_MESSAGE_EVENT_TYPE_SENT: apiTypes.MessageEventTypeSent = 1;

describe('Core to API Span adapters', () => {
  let realTimeOrigin: number;
  beforeEach(() => {
    realTimeOrigin = performance.timeOrigin;
  });
  afterEach(() => {
    restoreGetterOrValue(performance, 'timeOrigin', realTimeOrigin);
  });

  it('adapts @opencensus/web-core span to grpc-gateway properties', () => {
    mockGetterOrValue(performance, 'timeOrigin', 1548000000000);
    const rootSpan = new webCore.RootSpan(new webCore.Tracer());
    rootSpan.id = 'a56a50b90c653f00';
    rootSpan.traceId = '69f223f58668171cedf0c9eab06f0d36';
    (rootSpan.parentSpanId = 'b56a50b90c653f00'), (rootSpan.name = 'test1');
    rootSpan.kind = webCore.SpanKind.SERVER;
    rootSpan.startPerfTime = 5.001;
    rootSpan.endPerfTime = 30.000001;
    rootSpan.attributes = {
      a: 'abc',
      b: 123,
      c: false,
      d: 1.1,
      e: NaN,
      f: -5000,
    };
    rootSpan.annotations = [
      {
        description: 'annotation1',
        timestamp: 1535683887009.5,
        attributes: { xyz: 999 },
      },
    ];
    rootSpan.links = [
      {
        traceId: '79f223f58668171cedf0c9eab06f0d36',
        spanId: 'b56a50b90c653f00',
        type: webCore.LinkType.CHILD_LINKED_SPAN,
        attributes: {
          d: 'def',
          e: 456,
          f: true,
        },
      },
    ];
    rootSpan.status = { code: 7 };

    const expectedApiSpan: apiTypes.Span = {
      traceId: 'afIj9YZoFxzt8MnqsG8NNg==',
      spanId: 'pWpQuQxlPwA=',
      parentSpanId: 'tWpQuQxlPwA=',
      name: { value: 'test1' },
      kind: API_SPAN_KIND_SERVER,
      startTime: '2019-01-20T16:00:00.005001000Z',
      endTime: '2019-01-20T16:00:00.030000001Z',
      attributes: {
        attributeMap: {
          a: { stringValue: { value: 'abc' } },
          b: { doubleValue: 123 },
          c: { boolValue: false },
          d: { doubleValue: 1.1 },
          e: { doubleValue: NaN },
          f: { doubleValue: -5000 },
        },
      },
      timeEvents: {
        timeEvent: [
          {
            time: '2018-08-31T02:51:27.009Z',
            annotation: {
              description: { value: 'annotation1' },
              attributes: { attributeMap: { xyz: { doubleValue: 999 } } },
            },
          },
        ],
      },
      links: {
        link: [
          {
            traceId: 'efIj9YZoFxzt8MnqsG8NNg==',
            spanId: 'tWpQuQxlPwA=',
            type: API_LINK_TYPE_CHILD_LINKED_SPAN,
            attributes: {
              attributeMap: {
                d: { stringValue: { value: 'def' } },
                e: { doubleValue: 456 },
                f: { boolValue: true },
              },
            },
          },
        ],
      },
      status: { code: 7 },
      sameProcessAsParentSpan: true,
      tracestate: {},
    };

    const apiSpans = adaptRootSpan(rootSpan);

    expect(apiSpans.length).toBe(1);
    expect(apiSpans[0]).toEqual(expectedApiSpan);
  });

  it('adapts child spans of the root span', () => {
    mockGetterOrValue(performance, 'timeOrigin', 1548000000000);
    const tracer = new webCore.Tracer();
    const webSpan1 = new webCore.Span();
    webSpan1.id = '000000000000000a';
    webSpan1.traceId = '00000000000000000000000000000001';
    webSpan1.startPerfTime = 10.1;
    webSpan1.endPerfTime = 20.113;
    webSpan1.messageEvents = [
      {
        id: 1,
        timestamp: 19.002,
        type: webCore.MessageEventType.SENT,
        uncompressedSize: 22,
        compressedSize: 15,
      },
    ];
    const rootSpan = new webCore.RootSpan(tracer);
    rootSpan.spans = [webSpan1];
    rootSpan.startPerfTime = 5.001;
    rootSpan.endPerfTime = 30.000001;
    rootSpan.id = '000000000000000b';
    rootSpan.traceId = '00000000000000000000000000000001';
    rootSpan.annotations = [
      {
        timestamp: 41.001,
        description: 'annotation with perf time',
        attributes: { attr1: true },
      },
    ];

    const apiSpans = adaptRootSpan(rootSpan);

    const expectedApiSpans: apiTypes.Span[] = [
      {
        traceId: 'AAAAAAAAAAAAAAAAAAAAAQ==',
        spanId: 'AAAAAAAAAAs=',
        tracestate: {},
        parentSpanId: '',
        name: { value: 'unnamed' },
        kind: API_SPAN_KIND_UNSPECIFIED,
        startTime: '2019-01-20T16:00:00.005001000Z',
        endTime: '2019-01-20T16:00:00.030000001Z',
        attributes: { attributeMap: {} },
        timeEvents: {
          timeEvent: [
            {
              time: '2019-01-20T16:00:00.041001000Z',
              annotation: {
                description: {
                  value: 'annotation with perf time',
                },
                attributes: {
                  attributeMap: {
                    attr1: {
                      boolValue: true,
                    },
                  },
                },
              },
            },
          ],
        },
        links: { link: [] },
        status: { code: 0 },
        sameProcessAsParentSpan: true,
      },
      {
        traceId: 'AAAAAAAAAAAAAAAAAAAAAQ==',
        spanId: 'AAAAAAAAAAo=',
        tracestate: {},
        parentSpanId: '',
        name: { value: 'unnamed' },
        kind: API_SPAN_KIND_UNSPECIFIED,
        startTime: '2019-01-20T16:00:00.010100000Z',
        endTime: '2019-01-20T16:00:00.020113000Z',
        attributes: { attributeMap: {} },
        timeEvents: {
          timeEvent: [
            {
              time: '2019-01-20T16:00:00.019002000Z',
              messageEvent: {
                id: 1,
                type: API_MESSAGE_EVENT_TYPE_SENT,
                uncompressedSize: 22,
                compressedSize: 15,
              },
            },
          ],
        },
        links: { link: [] },
        status: { code: 0 },
        sameProcessAsParentSpan: true,
      },
    ];
    expect(apiSpans).toEqual(expectedApiSpans);
  });
});
