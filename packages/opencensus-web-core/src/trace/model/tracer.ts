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
import { RootSpan } from './root-span';
import { Span } from './span';
import { TracerBase } from './tracer-base';
import { randomTraceId } from '../../common/id-util';

/** Tracer manages the current root span and trace header propagation. */
export class Tracer extends TracerBase implements webTypes.Tracer {
  /**
   * Gets the current root span associated to Zone.current.
   * If the current zone does not have a root span (e.g. root zone),
   * create a new root.
   */
  get currentRootSpan(): Span {
    if (Zone.current.get('data')) {
      return Zone.current.get('data').rootSpan;
    }
    return new RootSpan(this);
  }

  /**
   * Sets the current root span to the current Zone.
   * If the current zone does not have a 'data' property (e.g. root zone)
   * do not set the root span.
   */
  set currentRootSpan(root: Span) {
    if (Zone.current.get('data')) {
      Zone.current.get('data')['rootSpan'] = root;
    }
  }

  /**
   * Creates a new Zone and start a new RootSpan to `currentRootSpan` associating
   * the new RootSpan to the new Zone. Thus, there might be several root spans
   * at the same time.
   * Currently no sampling decisions are propagated or made here.
   * @param options Options for tracer instance
   * @param fn Callback function
   * @returns The callback return
   */
  startRootSpan<T>(options: webTypes.TraceOptions, fn: (root: Span) => T): T {
    let traceId = randomTraceId();
    if (options.spanContext && options.spanContext.traceId) {
      traceId = options.spanContext.traceId;
    }
    // Create the new zone.
    const zoneSpec = {
      name: traceId,
      properties: {
        data: {
          isTracingZone: true,
          traceId,
        },
      },
    };
    const newZone = Zone.root.fork(zoneSpec);

    return newZone.run(() => {
      super.startRootSpan(options, root => {
        // Set the currentRootSpan to the new created root span.
        this.currentRootSpan = root;
        return fn(root);
      });
    });
  }

  /** Clears the current root span. */
  clearCurrentTrace() {
    this.currentRootSpan = new RootSpan(this);
  }

  /**
   * Start a new Span instance to the currentRootSpan
   * @param name Span name or SpanOptions object.
   * @param kind Span kind
   * @returns The new Span instance started
   */
  startChildSpan(options?: webTypes.SpanOptions): Span {
    return super.startChildSpan(
      Object.assign({ childOf: this.currentRootSpan }, options)
    );
  }

  /**
   * Binds the trace context to the given function - but because opencensus-web
   * currently only supports a single trace context at a time, this just returns
   * the function.
   */
  wrap<T>(fn: webTypes.Func<T>): webTypes.Func<T> {
    return fn;
  }

  /** Binds trace context to NodeJS event emitter. No-op for opencensus-web. */
  wrapEmitter(emitter: webTypes.NodeJsEventEmitter) {}
}
