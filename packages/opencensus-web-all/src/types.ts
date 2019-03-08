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

import {PerformanceLongTaskTiming, WindowWithLongTasks} from '@opencensus/web-instrumentation-perf';

/** OpenCensus Web configuration that can be set on `window`. */
export declare interface OpenCensusWebConfig {
  /**
   * Whether the initial load root span should be sampled for trace. This is
   * only a hint and should not be used to enforce sampling since clients could
   * simply ignore this field.
   */
  sampled?: boolean;
  /** Trace ID for the initial load spans. */
  traceId?: string;
  /** Span ID for the initial load fetch client span. */
  spanId?: string;
  /**
   * Start time of server fetch request for initial navigation HTML in server
   * time epoch milliseconds. This is used to correct for clock skew between
   * client and server before exporting spans.
   */
  reqStart?: number;
  /**
   * Duration of the server fetch request for initial HTML in server
   * milliseconds. This is also used to correct for clock skew.
   */
  reqDuration?: number;
  /**
   * HTTP root URL of the agent endpoint to write traces to.
   * Example 'https://my-oc-agent-deployment.com:55678'
   */
  agent?: string;
}

/**
 * Type for the `window` object with the variables OpenCensus Web interacts
 * with.
 */
export declare interface WindowWithOcwGlobals extends WindowWithLongTasks {
  ocwLt?: PerformanceLongTaskTiming[];
  ocwConfig?: OpenCensusWebConfig;
}
