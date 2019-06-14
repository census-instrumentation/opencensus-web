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
import { NoopExporter } from '../../exporters/noop_exporter';
import { Tracer } from './tracer';

export const NOOP_EXPORTER = new NoopExporter();

/** Main interface for tracing. */
export class Tracing implements webTypes.Tracing {
  /** Object responsible for managing a trace. */
  readonly tracer = new Tracer();

  /** Service to send collected traces to. */
  exporter = NOOP_EXPORTER;

  /** Whether tracing is active - always true for opencensus-web. */
  active = true;

  /** Singleton instance */
  private static singletonInstance: Tracing;

  /** Gets the tracing instance. */
  static get instance(): Tracing {
    return this.singletonInstance || (this.singletonInstance = new this());
  }

  /** Sets tracer and exporter config. */
  start(config?: webTypes.Config): webTypes.Tracing {
    this.tracer.start(config || {});
    if (config) {
      if (config.exporter) this.registerExporter(config.exporter);
    }
    return this;
  }

  /** Stops tracer - this is a no-op for opencensus-web. */
  stop() {}

  /**
   * Registers an exporter to send the collected traces to.
   * @param exporter The exporter to send the traces to.
   * @return The tracing object.
   */
  registerExporter(exporter: webTypes.Exporter): webTypes.Tracing {
    this.tracer.unregisterSpanEventListener(this.exporter);
    this.exporter = exporter;
    this.tracer.registerSpanEventListener(exporter);
    return this;
  }

  /**
   * Sets the exporter back to the no-op exporter.
   * @return The tracing object.
   */
  unregisterExporter(exporter: webTypes.Exporter): webTypes.Tracing {
    this.registerExporter(NOOP_EXPORTER);
    return this;
  }
}
