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
import { RootSpan } from '../src/trace/model/root-span';
import { TracerBase } from '../src/trace/model/tracer-base';

describe('TracerBase', () => {
  let tracer: TracerBase;
  let listener: webTypes.SpanEventListener;

  beforeEach(() => {
    tracer = new TracerBase();
    listener = jasmine.createSpyObj<webTypes.SpanEventListener>('listener', [
      'onStartSpan',
      'onEndSpan',
    ]);
    tracer.eventListeners = [listener];
  });

  describe('start', () => {
    it('sets logger and propagation based on config', () => {
      const mockLogger = jasmine.createSpyObj<webTypes.Logger>('logger', [
        'info',
      ]);
      const mockPropagation = jasmine.createSpyObj<webTypes.Propagation>(
        'propagation',
        ['generate']
      );

      const result = tracer.start({
        logger: mockLogger,
        propagation: mockPropagation,
      });

      expect(result).toBe(tracer);
      expect(tracer.logger).toBe(mockLogger);
      expect(tracer.propagation).toBe(mockPropagation);
    });
  });

  describe('onStartSpan', () => {
    it('notifies span listeners', () => {
      const newRoot = new RootSpan(tracer);
      tracer.onStartSpan(newRoot);
      expect(listener.onStartSpan).toHaveBeenCalledWith(newRoot);
    });
  });

  describe('onEndSpan', () => {
    it('notifies span listeners', () => {
      const newRoot = new RootSpan(tracer);
      tracer.onEndSpan(newRoot);
      expect(listener.onEndSpan).toHaveBeenCalledWith(newRoot);
    });
  });

  describe('registerSpanEventListener', () => {
    it('adds to listeners', () => {
      const newListener = jasmine.createSpyObj<webTypes.SpanEventListener>(
        'newListener',
        ['onStartSpan', 'onEndSpan']
      );
      tracer.registerSpanEventListener(newListener);
      expect(tracer.eventListeners).toEqual([listener, newListener]);
    });
  });

  describe('unregisterSpanEventListener', () => {
    it('removes from listeners', () => {
      tracer.unregisterSpanEventListener(listener);
      expect(tracer.eventListeners).toEqual([]);
    });
  });
});
