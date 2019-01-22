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

import {Tracer} from '../src/trace/model/tracer';
import {NOOP_EXPORTER, Tracing} from '../src/trace/model/tracing';

describe('Tracing', () => {
  let tracing: Tracing;
  let tracer: Tracer;
  let oldExporter: coreTypes.Exporter;
  let newExporter: coreTypes.Exporter;

  beforeEach(() => {
    tracing = new Tracing();
    tracer = tracing.tracer;
    spyOn(tracer, 'registerSpanEventListener');
    spyOn(tracer, 'unregisterSpanEventListener');
    spyOn(tracer, 'start');
    oldExporter = tracing.exporter;
    newExporter =
        jasmine.createSpyObj<coreTypes.Exporter>('mockExporter', ['publish']);
  });

  describe('default exporter', () => {
    it('is a no-op exporter', () => {
      expect(tracing.exporter).toBe(NOOP_EXPORTER);
    });
  });

  describe('start', () => {
    it('sets tracer config and registers exporter', () => {
      const config = {exporter: newExporter};

      tracing.start(config);

      expect(tracing.exporter).toBe(newExporter);
      expect(tracer.start).toHaveBeenCalledWith(config);
      expect(tracer.unregisterSpanEventListener)
          .toHaveBeenCalledWith(oldExporter);
      expect(tracer.registerSpanEventListener)
          .toHaveBeenCalledWith(newExporter);
    });
  });

  describe('registerExporter', () => {
    it('sets current root span and calls function with it', () => {
      tracing.registerExporter(newExporter);

      expect(tracing.exporter).toBe(newExporter);
      expect(tracer.unregisterSpanEventListener)
          .toHaveBeenCalledWith(oldExporter);
      expect(tracer.registerSpanEventListener)
          .toHaveBeenCalledWith(newExporter);
    });
  });

  describe('unregisterExporter', () => {
    it('unregisters the current exporter and registers the no-op one', () => {
      tracing.unregisterExporter(oldExporter);

      expect(tracer.unregisterSpanEventListener)
          .toHaveBeenCalledWith(oldExporter);
      newExporter = tracing.exporter;
      expect(tracer.registerSpanEventListener)

          .toHaveBeenCalledWith(newExporter);
      expect(newExporter).toBe(NOOP_EXPORTER);
    });
  });
});
