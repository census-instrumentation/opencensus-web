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
  getInitialLoadSpanContext,
  exportRootSpanAfterLoadEvent,
} from '@opencensus/web-initial-load';
import { isSampled } from '@opencensus/web-core';

import { InteractionTracker, TrackerOptions } from './interaction-tracker';
import { doPatching } from './monkey-patching';

/**
 * This is in charge of exporting the Initial page load trace to the OpenCensus
 * Agent and starts the tracing for the user interactions doing the necessary
 * monkey-patch for this. This is done depending on the sampling decision made
 * by  the initial page load module.
 */
export function startTracing(options?: TrackerOptions) {
  exportRootSpanAfterLoadEvent();
  // Do not start the interaction tracker if it is not sampled. This decision
  // is done in the Initial Load page module using the Initial Load Span
  // Context.
  // If it is sampled, all the interactions will be sampled, otherwise,
  // none of them are sampled.
  if (!isSampled(getInitialLoadSpanContext())) return;

  doPatching();
  InteractionTracker.startTracking(options);
}
