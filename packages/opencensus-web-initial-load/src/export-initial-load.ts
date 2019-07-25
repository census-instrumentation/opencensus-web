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

import { tracing, WindowWithOcwGlobals } from '@opencensus/web-core';
import { OCAgentExporter } from '@opencensus/web-exporter-ocagent';
import { getInitialLoadSpanContext } from './initial-load-context';
import { isSampled } from './initial-load-sampling';
import {
  getPerfEntries,
  getInitialLoadRootSpan,
  clearPerfEntries,
} from '@opencensus/web-instrumentation-perf';

const windowWithOcwGlobals = window as WindowWithOcwGlobals;

/**
 * How long to wait after `load` event to export initial load spans. This allows
 * time for any other post-load handlers to run first so that the work to export
 * spans does not slow down the user experience.
 */
const WAIT_TIME_AFTER_LOAD_MS = 2000; // 2 seconds

/** Trace endpoint in the OC agent. */
const TRACE_ENDPOINT = '/v1/trace';

/**
 * Waits until after the document `load` event fires, and then uses the
 * `window.ocAgent` setting to configure an OpenCensus agent exporter and
 * export the spans for the initial page load.
 */
export function exportRootSpanAfterLoadEvent() {
  if (!windowWithOcwGlobals.ocAgent) {
    console.log('Not configured to export page load spans.');
    return;
  }

  tracing.registerExporter(
    new OCAgentExporter({
      agentEndpoint: `${windowWithOcwGlobals.ocAgent}${TRACE_ENDPOINT}`,
    })
  );

  if (document.readyState === 'complete') {
    exportInitialLoadSpans();
  } else {
    window.addEventListener('load', () => {
      exportInitialLoadSpans();
    });
  }
}

function exportInitialLoadSpans() {
  setTimeout(() => {
    const spanContext = getInitialLoadSpanContext();
    if (!isSampled(spanContext)) return; // Don't export if not sampled.

    const perfEntries = getPerfEntries();

    const root = getInitialLoadRootSpan(
      tracing.tracer,
      perfEntries,
      spanContext.spanId,
      spanContext.traceId
    );

    clearPerfEntries();
    // Notify that the span has ended to trigger export.
    tracing.tracer.onEndSpan(root);
  }, WAIT_TIME_AFTER_LOAD_MS);
}
