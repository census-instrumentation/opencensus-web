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

import {Annotation, Attributes, SpanKind, Tracer} from '@opencensus/web-core';
import {getInitialLoadRootSpan} from '../src/initial-load-root-span';
import {GroupedPerfEntries} from '../src/perf-grouper';

const SPAN_ID_REGEX = /[0-9a-f]{16}/;
const TRACE_ID_REGEX = /[0-9a-f]{32}/;
const USER_AGENT = 'Mozilla/5.0 TEST';

const PERF_ENTRIES: GroupedPerfEntries = {
  resourceTimings: [
    {
      connectEnd: 0,
      connectStart: 0,
      decodedBodySize: 0,
      domainLookupEnd: 0,
      domainLookupStart: 0,
      duration: 13.100000011036173,
      encodedBodySize: 0,
      entryType: 'resource',
      fetchStart: 266.9999999925494,
      initiatorType: 'link',
      name: 'http://localhost:4200/resource',
      nextHopProtocol: 'h2',
      redirectEnd: 0,
      redirectStart: 0,
      requestStart: 0,
      responseEnd: 280.1000000035856,
      responseStart: 0,
      secureConnectionStart: 0,
      serverTiming: [],
      startTime: 266.9999999925494,
      transferSize: 0,
      workerStart: 0,
      toJSON: () => ({}),
    },
  ],
  longTasks: [
    {
      name: 'self',
      entryType: 'longtask',
      startTime: 11870.39999999979,
      duration: 1063.7000000024273,
      attribution: [{
        name: 'script',
        entryType: 'taskattribution',
        startTime: 0,
        duration: 0,
        containerType: 'iframe',
        containerSrc: '',
        containerId: '',
        containerName: '',
      }],
      toJSON: () => ({}),
    },
  ],
  navigationTiming: {
    name: 'http://localhost:4200/',
    entryType: 'navigation',
    startTime: 0,
    duration: 20985.30000000028,
    initiatorType: 'navigation',
    nextHopProtocol: 'http/1.1',
    workerStart: 0,
    redirectStart: 0,
    redirectEnd: 0,
    fetchStart: 25.100000002566958,
    domainLookupStart: 28.09999999954016,
    domainLookupEnd: 28.09999999954016,
    connectStart: 28.09999999954016,
    connectEnd: 28.300000001763692,
    secureConnectionStart: 0,
    requestStart: 28.500000000349246,
    responseStart: 384.6000000012282,
    responseEnd: 394.20000000245636,
    transferSize: 4667,
    encodedBodySize: 4404,
    decodedBodySize: 4404,
    serverTiming: [],
    unloadEventStart: 0,
    unloadEventEnd: 0,
    domInteractive: 12126.70000000071,
    domContentLoadedEventStart: 12126.70000000071,
    domContentLoadedEventEnd: 12933.80000000252,
    domComplete: 20967.70000000106,
    loadEventStart: 20967.899999999645,
    loadEventEnd: 20985.30000000028,
    type: 'navigate',
    redirectCount: 0,
    toJSON: () => ({}),
  },
  paintTimings: [
    {
      name: 'first-paint',
      entryType: 'paint',
      startTime: 606.9000000024971,
      duration: 0,
      toJSON: () => ({}),
    },
    {
      name: 'first-contentful-paint',
      entryType: 'paint',
      startTime: 606.9000000024971,
      duration: 0,
      toJSON: () => ({}),
    },
  ],
};

const EXPECTED_ROOT_ATTRIBUTES: Attributes = {
  'http.url': 'http://localhost:4200/',
  'http.user_agent': USER_AGENT,
  'nav.type': 'navigate',
};
const EXPECTED_ROOT_ANNOTATIONS: Annotation[] = [
  {
    timestamp: 12126.70000000071,
    description: 'domInteractive',
    attributes: {},
  },
  {
    timestamp: 20967.70000000106,
    description: 'domComplete',
    attributes: {},
  },
  {
    timestamp: 20967.899999999645,
    description: 'loadEventStart',
    attributes: {},
  },
  {
    timestamp: 20985.30000000028,
    description: 'loadEventEnd',
    attributes: {},
  },
  {
    timestamp: 606.9000000024971,
    description: 'first-paint',
    attributes: {},
  },
  {
    timestamp: 606.9000000024971,
    description: 'first-contentful-paint',
    attributes: {},
  },
];

const EXPECTED_NAV_FETCH_ATTRIBUTES: Attributes = {
  'http.url': 'http://localhost:4200/',
  'http.host': 'localhost:4200',
  'http.path': '/',
  'http.user_agent': USER_AGENT,
  'http.method': 'GET',
  'http.initiator_type': 'navigation',
  'http.next_hop_protocol': 'http/1.1',
  'http.resp_size': 4667,
  'http.resp_encoded_body_size': 4404,
  'http.resp_decoded_body_size': 4404,
};

const EXPECTED_NAV_FETCH_ANNOTATIONS: Annotation[] = [
  {
    timestamp: 25.100000002566958,
    description: 'fetchStart',
    attributes: {},
  },
  {
    timestamp: 28.09999999954016,
    description: 'domainLookupStart',
    attributes: {},
  },
  {
    timestamp: 28.09999999954016,
    description: 'domainLookupEnd',
    attributes: {},
  },
  {
    timestamp: 28.09999999954016,
    description: 'connectStart',
    attributes: {},
  },
  {
    timestamp: 28.300000001763692,
    description: 'connectEnd',
    attributes: {},
  },
  {
    timestamp: 28.500000000349246,
    description: 'requestStart',
    attributes: {},
  },
  {
    timestamp: 384.6000000012282,
    description: 'responseStart',
    attributes: {},
  },
  {
    timestamp: 394.20000000245636,
    description: 'responseEnd',
    attributes: {},
  },
];

const EXPECTED_RESOURCE_ATTRIBUTES: Attributes = {
  'http.url': 'http://localhost:4200/resource',
  'http.host': 'localhost:4200',
  'http.path': '/resource',
  'http.user_agent': 'Mozilla/5.0 TEST',
  'http.next_hop_protocol': 'h2',
  'http.method': 'GET',
  'http.initiator_type': 'link',
};
const EXPECTED_RESOURCE_ANNOTATIONS: Annotation[] = [
  {
    'timestamp': 266.9999999925494,
    'description': 'fetchStart',
    'attributes': {},
  },
  {
    'timestamp': 280.1000000035856,
    'description': 'responseEnd',
    'attributes': {},
  },
];

describe('getInitialLoadRootSpan', () => {
  beforeEach(() => {
    spyOnProperty(navigator, 'userAgent').and.returnValue(USER_AGENT);
  });

  it('creates a parent span for overall load and child spans', () => {
    const navigationFetchSpanId = '000000000000000a';
    const traceId = '0000000000000000000000000000000b';

    const root = getInitialLoadRootSpan(
        new Tracer(), PERF_ENTRIES, navigationFetchSpanId, traceId);

    expect(root.name).toBe('Nav./');
    expect(root.kind).toBe(SpanKind.UNSPECIFIED);
    expect(root.parentSpanId).toBe('');
    expect(root.id).toMatch(SPAN_ID_REGEX);
    expect(root.traceId).toBe(traceId);
    expect(root.startPerfTime).toBe(0);
    expect(root.endPerfTime).toBe(20985.30000000028);
    expect(root.attributes).toEqual(EXPECTED_ROOT_ATTRIBUTES);
    expect(root.annotations).toEqual(EXPECTED_ROOT_ANNOTATIONS);

    expect(root.spans.length).toBe(3);
    const [navigationFetchSpan, resourceSpan, longTaskSpan] = root.spans;

    expect(navigationFetchSpan.traceId).toBe(traceId);
    expect(navigationFetchSpan.id).toMatch(SPAN_ID_REGEX);
    expect(navigationFetchSpan.parentSpanId).toBe(root.id);
    expect(navigationFetchSpan.name).toBe('/');
    expect(navigationFetchSpan.kind).toBe(SpanKind.CLIENT);
    expect(navigationFetchSpan.startPerfTime).toBe(25.100000002566958);
    expect(navigationFetchSpan.endPerfTime).toBe(394.20000000245636);
    expect(navigationFetchSpan.attributes)
        .toEqual(EXPECTED_NAV_FETCH_ATTRIBUTES);
    expect(navigationFetchSpan.annotations)
        .toEqual(EXPECTED_NAV_FETCH_ANNOTATIONS);

    expect(resourceSpan.traceId).toBe(traceId);
    expect(resourceSpan.id).toMatch(SPAN_ID_REGEX);
    expect(resourceSpan.parentSpanId).toBe(root.id);
    expect(resourceSpan.name).toBe('/resource');
    expect(resourceSpan.kind).toBe(SpanKind.CLIENT);
    expect(resourceSpan.startPerfTime).toBe(266.9999999925494);
    expect(resourceSpan.endPerfTime).toBe(280.1000000035856);
    expect(resourceSpan.attributes).toEqual(EXPECTED_RESOURCE_ATTRIBUTES);
    expect(resourceSpan.annotations).toEqual(EXPECTED_RESOURCE_ANNOTATIONS);

    expect(longTaskSpan.traceId).toBe(traceId);
    expect(longTaskSpan.id).toMatch(SPAN_ID_REGEX);
    expect(longTaskSpan.parentSpanId).toBe(root.id);
    expect(longTaskSpan.name).toBe('Long JS task');
    expect(longTaskSpan.kind).toBe(SpanKind.UNSPECIFIED);
    expect(longTaskSpan.startPerfTime).toBe(11870.39999999979);
    expect(longTaskSpan.endPerfTime).toBe(12934.100000002218);
    expect(longTaskSpan.attributes).toEqual({
      'long_task.attribution':
          '[{"name":"script","entryType":"taskattribution","startTime":0,' +
          '"duration":0,"containerType":"iframe","containerSrc":"",' +
          '"containerId":"","containerName":""}]',
    });
    expect(longTaskSpan.annotations).toEqual([]);
  });

  it('defaults trace and span ID to random values if not specified', () => {
    const root = getInitialLoadRootSpan(new Tracer(), PERF_ENTRIES);

    expect(root.traceId).toMatch(TRACE_ID_REGEX);
    const navigationFetchSpan = root.spans[0];
    expect(navigationFetchSpan.id).toMatch(SPAN_ID_REGEX);
  });
});
