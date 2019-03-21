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

import {LinkType, MessageEventType} from '@opencensus/web-types';
import {Span} from '../src/trace/model/span';
import {mockGetterOrValue, restoreGetterOrValue} from './util';

describe('Span', () => {
  let span: Span;

  beforeEach(() => {
    span = new Span();
  });

  it('initializes id to random value', () => {
    expect(span.id).toMatch('^[a-z0-9]{16}$');
  });

  it('allows initializing id in constructor', () => {
    const span = new Span('000000000000000b');
    expect(span.id).toBe('000000000000000b');
  });

  describe('time fields', () => {
    let realTimeOrigin: number;
    beforeEach(() => {
      realTimeOrigin = performance.timeOrigin;
    });
    afterEach(() => {
      restoreGetterOrValue(performance, 'timeOrigin', realTimeOrigin);
    });

    it('calculates them based on startPerfTime/endPerfTime', () => {
      expect(span.ended).toBe(false);

      mockGetterOrValue(performance, 'timeOrigin', 1548000000000);
      span.startPerfTime = 2;
      span.endPerfTime = 4.5;

      expect(span.ended).toBe(true);
      expect(span.startTime.getTime()).toBe(1548000000002);
      expect(span.endTime.getTime()).toBe(1548000000004);
      expect(span.duration).toBe(2.5);
    });
  });

  it('calculates isRootSpan based on parentSpanId', () => {
    expect(span.parentSpanId).toBe('');
    expect(span.isRootSpan).toBe(true);

    span.parentSpanId = '000000000000000a';
    expect(span.isRootSpan).toBe(false);
  });

  it('calculates spanContext based on fields', () => {
    span.id = '000000000000000a';
    span.traceId = '00000000000000000000000000000001';
    span.traceState = 'a=b';

    expect(span.spanContext).toEqual({
      traceId: '00000000000000000000000000000001',
      spanId: '000000000000000a',
      options: 1,
      traceState: 'a=b',
    });
  });

  it('sets startPerfTime when start is called', () => {
    spyOn(performance, 'now').and.returnValue(55);
    span.start();
    expect(span.startPerfTime).toBe(55);
  });

  it('sets endPerfTime when end is called', () => {
    spyOn(performance, 'now').and.returnValue(33);
    span.end();
    expect(span.endPerfTime).toBe(33);
  });

  it('sets endPerfTime when truncate is called', () => {
    spyOn(performance, 'now').and.returnValue(77);
    span.truncate();
    expect(span.endPerfTime).toBe(77);
  });

  it('sets attribute when addAttribute called', () => {
    span.addAttribute('attr1', 23);

    expect(span.attributes).toEqual({attr1: 23});
  });

  it('adds link when addLink called', () => {
    span.addLink(
        /* traceId */ '00000000000000000000000000000001', /* spanId */
        '000000000000000a', /* type */ LinkType.CHILD_LINKED_SPAN,
        /* attributes */ {linkAttr: 2});

    expect(span.links).toEqual([{
      traceId: '00000000000000000000000000000001',
      spanId: '000000000000000a',
      type: LinkType.CHILD_LINKED_SPAN,
      attributes: {linkAttr: 2},
    }]);
  });

  describe('addAnnotation', () => {
    it('adds annotation with specified timestamp', () => {
      span.addAnnotation(
          'description1', {annotationAttr: 'a'}, /* timestamp */ 22);

      expect(span.annotations).toEqual([
        {
          description: 'description1',
          attributes: {annotationAttr: 'a'},
          timestamp: 22,
        },
      ]);
    });

    it('defaults to performance.now for timestamp', () => {
      spyOn(performance, 'now').and.returnValue(88);
      expect(span.addAnnotation('description2'));

      expect(span.annotations).toEqual([{
        description: 'description2',
        attributes: {},
        timestamp: 88,
      }]);
    });
  });

  describe('addMessageEvent', () => {
    it('adds message event with specified timestamp', () => {
      span.addMessageEvent(MessageEventType.SENT, 'id22', /* timestamp */ 25);

      expect(span.messageEvents).toEqual([
        {
          type: MessageEventType.SENT,
          id: 'id22',
          timestamp: 25,
        },
      ]);
    });

    it('defaults timestamp to performance.now', () => {
      spyOn(performance, 'now').and.returnValue(33);
      span.addMessageEvent(MessageEventType.RECEIVED, 'id23');

      expect(span.messageEvents).toEqual([
        {
          type: MessageEventType.RECEIVED,
          id: 'id23',
          timestamp: 33,
        },
      ]);
    });
  });
});
