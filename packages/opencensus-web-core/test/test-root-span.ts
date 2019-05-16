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

import { SpanKind } from '@opencensus/web-types';
import { RootSpan } from '../src/trace/model/root-span';
import { Tracer } from '../src/trace/model/tracer';

describe('RootSpan', () => {
  let tracer: Tracer;
  let root: RootSpan;

  beforeEach(() => {
    tracer = new Tracer();
    root = new RootSpan(tracer);
  });

  describe('constructor', () => {
    it('sets name, kind, parent, trace ID and  state via context', () => {
      root = new RootSpan(tracer, {
        name: 'root1',
        kind: SpanKind.CLIENT,
        spanContext: {
          spanId: '000000000000000a',
          traceId: '00000000000000000000000000000001',
          traceState: 'a=b',
        },
      });

      expect(root.name).toBe('root1');
      expect(root.kind).toBe(SpanKind.CLIENT);
      expect(root.parentSpanId).toBe('000000000000000a');
      expect(root.traceId).toBe('00000000000000000000000000000001');
      expect(root.traceState).toBe('a=b');
    });

    it('defaults to random trace ID if no context given', () => {
      expect(root.traceId).toMatch('^[a-z0-9]{32}$');
    });
  });

  describe('start', () => {
    it('sets start time and calls onStartSpan for tracer', () => {
      spyOn(tracer, 'onStartSpan');
      spyOn(performance, 'now').and.returnValue(3);

      root.start();

      expect(root.startPerfTime).toBe(3);
      expect(tracer.onStartSpan).toHaveBeenCalledWith(root);
    });
  });

  describe('end', () => {
    it('sets end time and calls onEndSpan for tracer', () => {
      spyOn(tracer, 'onEndSpan');
      spyOn(performance, 'now').and.returnValue(4);

      root.end();

      expect(root.endPerfTime).toBe(4);
      expect(tracer.onEndSpan).toHaveBeenCalledWith(root);
    });
  });

  describe('truncate', () => {
    it('sets end time and calls onEndSpan for tracer', () => {
      spyOn(tracer, 'onEndSpan');
      spyOn(performance, 'now').and.returnValue(4);

      root.end();

      expect(root.endPerfTime).toBe(4);
      expect(tracer.onEndSpan).toHaveBeenCalledWith(root);
    });
  });

  describe('nested spans', () => {
    it('should get nested spans from rootspan instance', () => {
      root.start();
      expect(root.numberOfChildren).toBe(0);
      const child1 = root.startChildSpan('child1', SpanKind.UNSPECIFIED);
      expect(root.numberOfChildren).toBe(1);
      expect(child1.numberOfChildren).toBe(0);
      const child2 = root.startChildSpan('child2', SpanKind.UNSPECIFIED);
      expect(root.numberOfChildren).toBe(2);
      const grandchild1 = child1.startChildSpan({
        name: 'grandchild1',
        kind: SpanKind.UNSPECIFIED,
      });
      expect(root.numberOfChildren).toBe(2);
      expect(child1.numberOfChildren).toBe(1);
      expect(child2.numberOfChildren).toBe(0);
      expect(grandchild1.numberOfChildren).toBe(0);

      expect(child1).toBe(root.spans[0]);
      expect(child2).toBe(root.spans[1]);
      expect(grandchild1.parentSpanId).toBe(child1.id);

      expect(child1.spans.length).toBe(1);
      expect(grandchild1).toBe(child1.spans[0]);

      expect(child2.spans.length).toBe(0);
      expect(child2.spans.length).toBe(0);
      expect(grandchild1.spans.length).toBe(0);

      expect(root.allDescendants().length).toBe(3);
    });
  });
});
