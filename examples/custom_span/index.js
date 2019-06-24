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

import {exportRootSpanAfterLoadEvent, tracing} from '@opencensus/web-all';

// Send the root span and child spans for the initial page load to the
// OpenCensus agent if this request was sampled for trace.
// This also registers the exporter.
exportRootSpanAfterLoadEvent();

const tracer = tracing.tracer;
tracer.startRootSpan(null, (root) => {
  root.name = 'Custom root span';
  setTimeout(() => {
    const customSpan = root.startChildSpan({name: 'Custom span'});
    customSpan.addAttribute('custom-key', 'custom-value');
    setTimeout(() => {
      customSpan.end();
    }, 20);
  }, 50);

  setTimeout(() => {
    root.addAttribute('custom-root-key', 'custom-root-value');
    root.end();
    document.getElementById('custom-trace-id').innerText = root.traceId;
  }, 1000);
});
