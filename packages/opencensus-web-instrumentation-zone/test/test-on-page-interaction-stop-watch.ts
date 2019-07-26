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
import { RootSpan, Tracer, WindowWithOcwGlobals } from '@opencensus/web-core';
import { OnPageInteractionStopwatch } from '../src/on-page-interaction-stop-watch';

describe('OnPageInteractionStopWatch', () => {
  let root: RootSpan;
  let tracer: Tracer;
  let interaction: OnPageInteractionStopwatch;
  let target: HTMLElement;
  const windowWithOcwGlobals = window as WindowWithOcwGlobals;

  describe('Tasks tracking', () => {
    beforeEach(() => {
      tracer = Tracer.instance;
      root = new RootSpan(tracer, { name: 'root1' });
      target = document.createElement('button');
      const interactionData = {
        startLocationHref: location.href,
        startLocationPath: location.pathname,
        eventType: 'click',
        target,
        rootSpan: root,
      };
      interaction = new OnPageInteractionStopwatch(interactionData);
    });
    it('should track number of active tasks', () => {
      interaction.incrementTaskCount();
      interaction.incrementTaskCount();
      expect(interaction.getTaskCount()).toBe(2);
      interaction.decrementTaskCount();
      expect(interaction.getTaskCount()).toBe(1);
      expect(interaction.hasRemainingTasks()).toBeTruthy();
      interaction.decrementTaskCount();
      expect(interaction.getTaskCount()).toBe(0);
      // Decrement again to test no decrement if count is 0.
      interaction.decrementTaskCount();
      expect(interaction.getTaskCount()).toBe(0);
      expect(interaction.hasRemainingTasks()).toBeFalsy();
    });
  });

  describe('stopAndRecord()', () => {
    const traceId = '0af7651916cd43dd8448eb211c80319c';
    const spanId = 'b7ad6b7169203331';
    windowWithOcwGlobals.traceparent = `00-${traceId}-${spanId}-01`;
    beforeEach(() => {
      tracer = Tracer.instance;
      root = new RootSpan(tracer, { name: 'root1' });
      target = document.createElement('button');
      const interactionData = {
        startLocationHref: location.href,
        startLocationPath: location.pathname,
        eventType: 'click',
        target,
        rootSpan: root,
      };
      interaction = new OnPageInteractionStopwatch(interactionData);
    });
    it('should stop an on page interaction and end the root span', () => {
      spyOn(tracer, 'onEndSpan');
      interaction.stopAndRecord();

      expect(root.attributes['EventType']).toBe('click');
      expect(root.attributes['TargetElement']).toBe(target.tagName);
      expect(root.attributes['initial_load_trace_id']).toBe(traceId);
      expect(tracer.onEndSpan).toHaveBeenCalledWith(root);
    });
    it('Should not finish the interaction when there are remaining tasks', () => {
      const onEndSpanSpy = spyOn(tracer, 'onEndSpan');
      interaction.incrementTaskCount();
      interaction.stopAndRecord();

      expect(onEndSpanSpy).not.toHaveBeenCalled();
    });
  });
});
