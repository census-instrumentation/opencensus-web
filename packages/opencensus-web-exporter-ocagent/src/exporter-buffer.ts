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

import {BufferConfig, Exporter, RootSpan} from '@opencensus/core';

/**
 * Controls the sending of traces to exporters.
 *
 * This is based on the ExporterBuffer in the @opencensus/core package, but this
 * is modified to use only APIs available in the browser and is simplified to
 * enable a small final package size for web clients.
 * See:
 * https://github.com/census-instrumentation/opencensus-node/blob/master/packages/opencensus-core/src/exporters/exporter-buffer.ts
 */
export class ExporterBuffer {
  /** Trace queue of a buffer */
  private queue: RootSpan[] = [];

  constructor(
      /** The service to send the collected spans. */
      private readonly exporter: Exporter,
      /** Configuration object to specify bufferTimeout and bufferSize. */
      private readonly config: BufferConfig) {}

  /**
   * Adds a root span to the buffer. The buffer will be flushed if the queue
   * length exceeds config.bufferSize or at least bufferTimeout milliseconds
   * have passed since the first root span was added to the buffer.
   */
  addToBuffer(root: RootSpan) {
    this.queue.push(root);

    if (this.config.bufferSize && this.queue.length > this.config.bufferSize) {
      this.flush();
      return this;
    }

    setTimeout(() => {
      if (this.queue.length) this.flush();
    }, this.config.bufferTimeout);

    return this;
  }

  private flush() {
    this.exporter.publish(this.queue);
    this.queue = [];
  }
}
