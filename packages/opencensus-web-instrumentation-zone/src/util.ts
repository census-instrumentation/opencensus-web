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

import { WindowWithInteractionGlobals, InteractionName } from './zone-types';
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

/**
 * Get the trace ID from the zone properties.
 */
export function getTraceId(zone: Zone): string {
  return zone && zone.get('data') ? zone.get('data').traceId : '';
}

/**
 * Get the trace ID from the zone properties.
 */
export function isRootSpanNameReplaceable(zone: Zone): boolean {
  return zone && zone.get('data')
    ? zone.get('data').isRootSpanNameReplaceable
    : false;
}

/**
 * Look for 'data-ocweb-id' attibute in the HTMLElement in order to
 * give a name to the user interaction and Root span. If this attibute is
 * not present, use the element ID, tag name and event name, generating a CSS
 * selector. In this case, also mark the interaction name as replaceable.
 * Thus, the resulting interaction name will be: "<tag_name>#id event_name"
 * (e.g. "button#save_changes click").
 * In case the name is not resolvable, return undefined (e.g. element is the
 * `document`).
 * @param element
 */
export function resolveInteractionName(
  element: HTMLElement | null,
  eventName: string
): InteractionName | undefined {
  if (!element) return undefined;
  if (!element.getAttribute) return undefined;
  if (element.hasAttribute('disabled')) {
    return undefined;
  }
  let interactionName = element.getAttribute('data-ocweb-id');
  let nameCanChange = false;
  if (!interactionName) {
    const elementId = element.getAttribute('id') || '';
    const tagName = element.tagName;
    if (!tagName) return undefined;
    nameCanChange = true;
    interactionName =
      tagName.toLowerCase() +
      (elementId ? '#' + elementId : '') +
      (eventName ? ' ' + eventName : '');
  }
  return { name: interactionName, isReplaceable: nameCanChange };
}
