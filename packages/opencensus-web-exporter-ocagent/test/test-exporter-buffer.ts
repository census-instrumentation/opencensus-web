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

import {Exporter, RootSpan, Tracer} from '@opencensus/web-core';
import {ExporterBuffer} from '../src/exporter-buffer';

const TRACER = new Tracer();
const SPAN1 = new RootSpan(TRACER);
const SPAN2 = new RootSpan(TRACER);
const SPAN3 = new RootSpan(TRACER);
const BUFFER_SIZE = 1;
const BUFFER_TIMEOUT = 100;

describe('ExporterBuffer', () => {
  let exporter: Exporter;
  let buffer: ExporterBuffer;

  beforeEach(() => {
    jasmine.clock().install();
    exporter = jasmine.createSpyObj<Exporter>('exporter', ['publish']);
    buffer = new ExporterBuffer(
        exporter, {bufferSize: BUFFER_SIZE, bufferTimeout: BUFFER_TIMEOUT});
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('flushes root spans when it reaches a buffer size maximum', () => {
    // Add one span and make sure it is not flushed since it had a buffer
    // size of 1.
    buffer.addToBuffer(SPAN1);
    expect(exporter.publish).not.toHaveBeenCalled();

    // Now add a second span and make sure it flushes the buffer.
    buffer.addToBuffer(SPAN2);
    expect(exporter.publish).toHaveBeenCalledWith([SPAN1, SPAN2]);

    // Adding a third span should not trigger another flush since the buffer was
    // cleared after the second spand.
    buffer.addToBuffer(SPAN3);
    expect(exporter.publish).toHaveBeenCalledTimes(1);
  });

  it('flushes root spans when it reaches a buffer timeout', () => {
    buffer.addToBuffer(SPAN1);
    expect(exporter.publish).not.toHaveBeenCalled();

    jasmine.clock().tick(BUFFER_TIMEOUT);

    expect(exporter.publish).toHaveBeenCalledWith([SPAN1]);
  });
});
