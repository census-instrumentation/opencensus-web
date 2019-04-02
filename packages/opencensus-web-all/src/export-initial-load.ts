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

import {isSampled, setPerfTimeOrigin, tracing} from '@opencensus/web-core';
import {OCAgentExporter} from '@opencensus/web-exporter-ocagent';
import {clearPerfEntries, getInitialLoadRootSpan, getPerfEntries, PerformanceResourceTimingExtended} from '@opencensus/web-instrumentation-perf';

import {getInitialLoadSpanContext} from './initial-load-context';
import {WindowWithOcwGlobals} from './types';

const windowWithOcwGlobals = window as WindowWithOcwGlobals;

/**
 * How long to wait after `load` event to export initial load spans. This allows
 * time for any other post-load handlers to run first so that the work to export
 * spans does not slow down the user experience.
 */
// const WAIT_TIME_AFTER_LOAD_MS = 2000;  // 2 seconds

/** Trace endpoint in the OC agent. */
const TRACE_ENDPOINT = '/v1/trace';

const TIME_ENDPOINT = '/v1/time';

/**
 * Waits until after the document `load` event fires, and then uses the
 * `window.ocwAgent` setting to configure an OpenCensus agent exporter and
 * export the spans for the initial page load.
 */
export function exportRootSpanAfterLoadEvent() {
  if (!windowWithOcwGlobals.ocwAgent) {
    console.log('Not configured to export page load spans.');
    return;
  }

  tracing.registerExporter(new OCAgentExporter(
      {agentEndpoint: `${windowWithOcwGlobals.ocwAgent}${TRACE_ENDPOINT}`}));

  if (document.readyState === 'complete') {
    exportInitialLoadSpans();
  } else {
    window.addEventListener('load', () => {
      exportInitialLoadSpans();
    });
  }
}

function fixClockSkew(done: () => void) {
  const agent = windowWithOcwGlobals.ocwAgent;
  if (!agent) {
    done();
    return;
  }
  const timeUrl = `${agent}${TIME_ENDPOINT}`;

  const xhr = new XMLHttpRequest();
  xhr.onreadystatechange = () => {
    if (xhr.readyState === 4 && xhr.status === 200) {
      const agentTime = Number(xhr.response);
      const agentTimePerfEntry =
          performance.getEntriesByType('resource')
              .filter(t => t.name.endsWith(TIME_ENDPOINT))[0] as
          PerformanceResourceTimingExtended;
      setTimeOrigin(agentTime, agentTimePerfEntry);
      done();
    }
  };
  xhr.open('GET', timeUrl);
  xhr.send();
}

function setTimeOrigin(
    agentTime: number, agentTimePerfEntry: PerformanceResourceTimingExtended) {
  const clientStart = agentTimePerfEntry.requestStart;
  const clientEnd = agentTimePerfEntry.responseStart;
  const networkTime = clientEnd - clientStart;  // Assume server took ~0 time.
  const halfNetworkTime = networkTime / 2;
  const clientStartInServerTime = agentTime - halfNetworkTime;
  setPerfTimeOrigin(clientStartInServerTime - clientStart);
}

function exportInitialLoadSpans() {
  fixClockSkew(() => {
    const spanContext = getInitialLoadSpanContext();
    if (!isSampled(spanContext)) return;  // Don't export if not sampled.

    const perfEntries = getPerfEntries();

    const root = getInitialLoadRootSpan(
        tracing.tracer, perfEntries, spanContext.spanId, spanContext.traceId);

    clearPerfEntries();
    // Notify that the span has ended to trigger export.
    tracing.tracer.onEndSpan(root);
  });
}
