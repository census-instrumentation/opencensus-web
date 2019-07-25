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

import {
  PerformanceLongTaskTiming,
  WindowWithLongTasks,
} from '@opencensus/web-instrumentation-perf';
import { WindowWithOcwGlobals } from '@opencensus/web-core';

/**
 * Type for `window` object with variables necessary global variables for
 * initial load package.
 */
export declare interface WindowWithInitialLoadGlobals
  extends WindowWithLongTasks,
    WindowWithOcwGlobals {
  /**
   * List to collect long task timings as they are observed. This is on the
   * window so that the code to instrument the long tasks and the code that
   * exports it can be in different JS bundles. This enables deferring loading
   * the export code until it is needed.
   */
  ocLt?: PerformanceLongTaskTiming[];
}
