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
import { Tracer } from '../src/trace/model/tracer';

describe('Tracer', () => {
  let tracer: Tracer;
  let listener: webTypes.SpanEventListener;
  const options = { name: 'test' };

  beforeEach(() => {
    tracer = new Tracer();
    listener = jasmine.createSpyObj<webTypes.SpanEventListener>('listener', [
      'onStartSpan',
      'onEndSpan',
    ]);
    tracer.eventListeners = [listener];
  });

  /** Should get/set the current RootSpan from tracer instance */
  describe('get/set currentRootSpan()', () => {
    it('should get the current RootSpan from tracer instance', () => {
      tracer.startRootSpan(options, root => {
        expect(root).toBeTruthy();
        expect(root).toBe(tracer.currentRootSpan);
      });
    });
  });

  describe('startRootSpan', () => {
    it('should create a new RootSpan instance', () => {
      tracer.startRootSpan(options, rootSpan => {
        expect(rootSpan).toBeTruthy();
      });
    });
    it('sets current root span', () => {
      const oldRoot = tracer.currentRootSpan;

      tracer.startRootSpan(options, rootSpan => {
        expect(rootSpan.name).toBe('test');
        expect(rootSpan).not.toBe(oldRoot);
        expect(tracer.currentRootSpan).toBe(rootSpan);
        expect(listener.onStartSpan).toHaveBeenCalledWith(rootSpan);
      });
    });
    it('should create a new Zone and RootSpan an associated to the zone', () => {
      tracer.startRootSpan(options, rootSpan => {
        expect(rootSpan).toBeTruthy();
        expect(Zone.current).not.toBe(Zone.root);
        expect(Zone.current.get('data').rootSpan).toBe(rootSpan);
      });
    });
  });

  describe('clearCurrentTrace', () => {
    it('resets currentRootSpan to new root', () => {
      const oldRoot = tracer.currentRootSpan;
      tracer.clearCurrentTrace();
      expect(tracer.currentRootSpan).not.toBe(oldRoot);
    });
  });

  describe('startChildSpan', () => {
    let rootSpanLocal: webTypes.Span;
    let span: webTypes.Span;
    it('starts a child span of the current root span', () => {
      tracer.startRootSpan(options, rootSpan => {
        rootSpanLocal = rootSpan;
        span = tracer.startChildSpan({
          name: 'child1',
          kind: webTypes.SpanKind.CLIENT,
        });
      });
      expect(span).toBeTruthy();
      expect(rootSpanLocal.numberOfChildren).toBe(1);
      expect(rootSpanLocal.spans[0]).toBe(span);
    });
  });

  describe('wrap', () => {
    it('just returns the given function', () => {
      const wrapFn = jasmine.createSpy('wrapFn');
      expect(tracer.wrap(wrapFn)).toBe(wrapFn);
    });
  });
});
