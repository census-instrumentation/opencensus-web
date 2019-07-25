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

import { SpanContext } from '@opencensus/web-types';

import { traceParentToSpanContext } from '@opencensus/web-propagation-tracecontext';

import {
  randomTraceId,
  randomSpanId,
  WindowWithOcwGlobals,
} from '@opencensus/web-core';
import { makeRandomSamplingDecision } from './initial-load-sampling';

const windowWithOcwGlobals = window as WindowWithOcwGlobals;

/**
 * The default trace sampling rate if no `traceparent` and no `ocSampleRate`
 * are specified on the `window`.
 */
const DEFAULT_SAMPLE_RATE = 0.0001;

/**
 * Store the Span Context generated for the initial load. This Span Context
 * will be passed around other packages in order to have the same sampling
 * decision and allow to relate the initial load trace to other traces.
 */
let initialLoadSpanContext: SpanContext | undefined;

/**
 * Gets a span context for the initial page load from the `window.traceparent`,
 * or generates a new random span context if it is missing. For now the new
 * random span context generated if `window.traceparent` is missing is always
 * marked sampled. If the initial load span context was already generated,
 * return `initialLoadSpanContext`.
 */
export function getInitialLoadSpanContext(): SpanContext {
  if (initialLoadSpanContext) return initialLoadSpanContext;

  if (!windowWithOcwGlobals.traceparent) {
    initialLoadSpanContext = randomSampledSpanContext();
  } else {
    const spanContext = traceParentToSpanContext(
      windowWithOcwGlobals.traceparent
    );
    if (!spanContext) {
      console.log(`Invalid traceparent: ${windowWithOcwGlobals.traceparent}`);
      initialLoadSpanContext = randomSampledSpanContext();
    } else {
      initialLoadSpanContext = spanContext;
    }
  }
  return initialLoadSpanContext;
}

/**
 * Set initial load span context as undefined. This is helpful for test to
 * reset the previously generated span context.
 * This is only exported for testing purposes.
 */
export function resetInitialLoadSpanContext() {
  initialLoadSpanContext = undefined;
}

function randomSampledSpanContext() {
  const sampleRate = windowWithOcwGlobals.ocSampleRate || DEFAULT_SAMPLE_RATE;
  return {
    traceId: randomTraceId(),
    spanId: randomSpanId(),
    options: makeRandomSamplingDecision(sampleRate),
  };
}
