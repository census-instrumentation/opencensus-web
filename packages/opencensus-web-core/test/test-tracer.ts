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
import { WindowWithZone } from '../src/trace/model/types';

describe('Tracer', () => {
  let tracer: Tracer;
  let listener: webTypes.SpanEventListener;
  const options = { name: 'test' };
  let realZone: Function | undefined;
  const windowWithZone = window as WindowWithZone;

  beforeEach(() => {
    tracer = new Tracer();
    listener = jasmine.createSpyObj<webTypes.SpanEventListener>('listener', [
      'onStartSpan',
      'onEndSpan',
    ]);
    tracer.eventListeners = [listener];
  });

  describe('Zone is not present', () => {
    beforeEach(() => {
      realZone = windowWithZone.Zone;
      windowWithZone.Zone = undefined;
    });

    afterEach(() => {
      windowWithZone.Zone = realZone;
    });

    it('isZonePresent() is false', () => {
      expect(tracer.isZonePresent()).toBeFalsy();
    });

    describe('get/set currentRootSpan()', () => {
      // As `Zone` is not present, the current root span is accesible outside
      // the callback as there is only one current root span.
      it('should get the current RootSpan from tracer instance', () => {
        const onStartFn = jasmine.createSpy('onStartFn');
        tracer.startRootSpan(options, onStartFn);
        const onStartRoot = onStartFn.calls.argsFor(0)[0];
        expect(onStartRoot).toBe(tracer.currentRootSpan);
      });
    });

    describe('startRootSpan', () => {
      it('should create start RootSpan', () => {
        const onStartFn = jasmine.createSpy('onStartFn');
        const oldRoot = tracer.currentRootSpan;

        tracer.startRootSpan(options, onStartFn);

        expect(onStartFn).toHaveBeenCalled();
        const onStartRoot = onStartFn.calls.argsFor(0)[0];
        expect(onStartRoot.name).toBe('test');
        expect(onStartRoot).not.toBe(oldRoot);
        expect(tracer.currentRootSpan).toBe(onStartRoot);
        expect(listener.onStartSpan).toHaveBeenCalledWith(onStartRoot);
      });
    });

    describe('startChildSpan', () => {
      it('starts a child span of the current root span', () => {
        spyOn(tracer.currentRootSpan, 'startChildSpan');
        tracer.startChildSpan({
          name: 'child1',
          kind: webTypes.SpanKind.CLIENT,
        });
        expect(tracer.currentRootSpan.startChildSpan).toHaveBeenCalledWith({
          childOf: tracer.currentRootSpan,
          name: 'child1',
          kind: webTypes.SpanKind.CLIENT,
        });
      });
    });
  });

  describe('Zone is present', () => {
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
      it('should create a new Zone and RootSpan associated to the zone', () => {
        tracer.startRootSpan(options, rootSpan => {
          expect(rootSpan).toBeTruthy();
          expect(Zone.current).not.toBe(Zone.root);
          expect(Zone.current.get('data').rootSpan).toBe(rootSpan);
        });
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
  });

  describe('clearCurrentTrace', () => {
    it('resets currentRootSpan to new root', () => {
      const oldRoot = tracer.currentRootSpan;
      tracer.clearCurrentTrace();
      expect(tracer.currentRootSpan).not.toBe(oldRoot);
    });
  });

  describe('wrap', () => {
    it('just returns the given function', () => {
      const wrapFn = jasmine.createSpy('wrapFn');
      expect(tracer.wrap(wrapFn)).toBe(wrapFn);
    });
  });
});
