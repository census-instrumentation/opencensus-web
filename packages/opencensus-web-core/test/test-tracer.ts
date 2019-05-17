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

  beforeEach(() => {
    tracer = new Tracer();
    listener = jasmine.createSpyObj<webTypes.SpanEventListener>('listener', [
      'onStartSpan',
      'onEndSpan',
    ]);
    tracer.eventListeners = [listener];
  });

  describe('startRootSpan', () => {
    it('sets current root span and calls function with it', () => {
      const onStartFn = jasmine.createSpy('onStartFn');
      const oldRoot = tracer.currentRootSpan;

      tracer.startRootSpan({ name: 'root1' }, onStartFn);

      expect(onStartFn).toHaveBeenCalled();
      const onStartRoot = onStartFn.calls.argsFor(0)[0];
      expect(onStartRoot.name).toBe('root1');
      expect(onStartRoot).not.toBe(oldRoot);
      expect(tracer.currentRootSpan).toBe(onStartRoot);
      expect(listener.onStartSpan).toHaveBeenCalledWith(onStartRoot);
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
    it('starts a child span of the current root span', () => {
      spyOn(tracer.currentRootSpan, 'startChildSpan');
      tracer.startChildSpan({ name: 'child1', kind: webTypes.SpanKind.CLIENT });
      expect(tracer.currentRootSpan.startChildSpan).toHaveBeenCalledWith({
        childOf: tracer.currentRootSpan,
        name: 'child1',
        kind: webTypes.SpanKind.CLIENT,
      });
    });
  });

  describe('wrap', () => {
    it('just returns the given function', () => {
      const wrapFn = jasmine.createSpy('wrapFn');
      expect(tracer.wrap(wrapFn)).toBe(wrapFn);
    });
  });
});
