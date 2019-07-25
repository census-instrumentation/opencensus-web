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

import { WindowWithInteractionGlobals } from './zone-types';
import { parseUrl } from '@opencensus/web-core';

/** Check that the trace */
export function traceOriginMatchesOrSameOrigin(xhrUrl: string): boolean {
  const traceHeaderHostRegex = (window as WindowWithInteractionGlobals)
    .ocTraceHeaderHostRegex as string;
  const parsedUrl = parseUrl(xhrUrl);

  if (parsedUrl.origin === location.origin) return true;

  return !!(traceHeaderHostRegex && parsedUrl.host.match(traceHeaderHostRegex));
}

/**
 * Whether or not a task is being tracked as part of an interaction.
 */
export function isTrackedTask(task: Task): boolean {
  return !!(
    task.zone &&
    task.zone.get('data') &&
    task.zone.get('data').isTracingZone
  );
}
