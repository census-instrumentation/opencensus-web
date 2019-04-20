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

import {OCAgentExporter} from '../src';
import * as apiTypes from '../src/api-types';
import {mockGetterOrValue, restoreGetterOrValue} from './util';

const BUFFER_SIZE = 1;
const BUFFER_TIMEOUT = 100;

function makeMockRootSpan(name: string): webCore.RootSpan {
  const span = new webCore.RootSpan(new webCore.Tracer());
  span.name = name;
  span.id = 'a56a50b90c653f00';
  span.traceId = '69f223f58668171cedf0c9eab06f0d36';
  span.startPerfTime = 0;
  span.endPerfTime = 1;
  return span;
}

const SPAN1 = makeMockRootSpan('1');
const SPAN2 = makeMockRootSpan('2');

const SPAN1_API_JSON: apiTypes.Span = {
  traceId: 'afIj9YZoFxzt8MnqsG8NNg==',
  spanId: 'pWpQuQxlPwA=',
  tracestate: {},
  parentSpanId: '',
  name: {value: '1'},
  kind: 0,
  startTime: '2019-01-04T00:00:00.000000000Z',
  endTime: '2019-01-04T00:00:00.001000000Z',
  attributes: {attributeMap: {}},
  timeEvents: {timeEvent: []},
  links: {link: []},
  status: {code: 0},
  sameProcessAsParentSpan: true,
};
const SPAN2_API_JSON: apiTypes.Span = {
  traceId: 'afIj9YZoFxzt8MnqsG8NNg==',
  spanId: 'pWpQuQxlPwA=',
  tracestate: {},
  parentSpanId: '',
  name: {value: '2'},
  kind: 0,
  startTime: '2019-01-04T00:00:00.000000000Z',
  endTime: '2019-01-04T00:00:00.001000000Z',
  attributes: {attributeMap: {}},
  timeEvents: {timeEvent: []},
  links: {link: []},
  status: {code: 0},
  sameProcessAsParentSpan: true,
};

describe('OCAgentExporter', () => {
  let exporter: OCAgentExporter;
  let xhrSendSpy: jasmine.Spy;
  let realTimeOrigin: number;

  beforeEach(() => {
    jasmine.clock().install();
    realTimeOrigin = performance.timeOrigin;
    mockGetterOrValue(performance, 'timeOrigin', 1546560000000);

    spyOn(XMLHttpRequest.prototype, 'open');
    xhrSendSpy = spyOn(XMLHttpRequest.prototype, 'send');
    spyOn(XMLHttpRequest.prototype, 'setRequestHeader');

    exporter = new OCAgentExporter({
      serviceName: 'testService',
      agentEndpoint: 'fake-agent.com',
      attributes: {serviceAddr1: 'a'},
      bufferSize: BUFFER_SIZE,
      bufferTimeout: BUFFER_TIMEOUT,
    });
  });

  afterEach(() => {
    jasmine.clock().uninstall();
    restoreGetterOrValue(performance, 'timeOrigin', realTimeOrigin);
  });

  function verifySpansExported(apiSpans: apiTypes.Span[]) {
    expect(XMLHttpRequest.prototype.open)
        .toHaveBeenCalledWith('POST', 'fake-agent.com');
    expect(XMLHttpRequest.prototype.setRequestHeader)
        .toHaveBeenCalledWith('Content-Type', 'application/json');
    expect(XMLHttpRequest.prototype.send).toHaveBeenCalledTimes(1);
    const sentBody = xhrSendSpy.calls.argsFor(0)[0];
    const sentJson = JSON.parse(sentBody);
    const expectedSentJson: apiTypes.ExportTraceServiceRequest = {
      node: {
        identifier: {hostName: window.location.host},
        serviceInfo: {name: 'testService'},
        libraryInfo: {
          language: 10,
          coreLibraryVersion: '0.0.1',
          exporterVersion: '0.0.1',
        },
        attributes: {serviceAddr1: 'a'},
      },
      spans: apiSpans,
    };
    expect(sentJson).toEqual(expectedSentJson);
  }

  it('exports spans once the buffer is filled', () => {
    exporter.onEndSpan(SPAN1);
    expect(XMLHttpRequest.prototype.open).not.toHaveBeenCalled();
    expect(XMLHttpRequest.prototype.send).not.toHaveBeenCalled();
    exporter.onEndSpan(SPAN2);
    verifySpansExported([SPAN1_API_JSON, SPAN2_API_JSON]);
  });

  it('exports spans when the buffer timeout passes', () => {
    exporter.onEndSpan(SPAN1);
    expect(XMLHttpRequest.prototype.send).not.toHaveBeenCalled();
    jasmine.clock().tick(BUFFER_TIMEOUT);
    verifySpansExported([SPAN1_API_JSON]);
  });

  it('exports spans when publish is called directly', () => {
    exporter.publish([SPAN1, SPAN2]);
    verifySpansExported([SPAN1_API_JSON, SPAN2_API_JSON]);
  });
});
