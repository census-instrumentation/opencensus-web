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

import { tracing } from '@opencensus/web-core';
import { getTraceId } from './util';

/**
 * Set of strings to store the trace Id of interactions that might change the
 * name during interaction tracking. This is the case when interaction name is
 * a CSS selector.
 */
export const interactionsMightChangeName = new Set<string>();

/**
 * Monkey-patch `History API` to detect route transitions. This is necessary
 * because there might be some cases when there are several interactions being
 * tracked at the same time but if there is an user interaction that triggers a
 * route transition while those interactions are still in tracking, only that
 * interaction will have a `Navigation` name. Otherwise, if this is not patched
 * the other interactions will change the name to `Navigation` even if they did
 * not cause the route transition.
 */
export function patchHistoryApi() {
  const pushState = history.pushState;
  history.pushState = (
    data: unknown,
    title: string,
    url?: string | null | undefined
  ) => {
    patchHistoryApiMethod(pushState, data, title, url);
  };

  const replaceState = history.replaceState;
  history.replaceState = (
    data: unknown,
    title: string,
    url?: string | null | undefined
  ) => {
    patchHistoryApiMethod(replaceState, data, title, url);
  };

  const back = history.back;
  history.back = () => {
    patchHistoryApiMethod(back);
  };

  const forward = history.forward;
  history.forward = () => {
    patchHistoryApiMethod(forward);
  };

  const go = history.go;
  history.go = (delta?: number) => {
    patchHistoryApiMethod(go, delta);
  };

  const patchHistoryApiMethod = (func: Function, ...args: unknown[]) => {
    // Store the location.pathname before it changes calling `func`.
    const currentPathname = location.pathname;
    func.call(history, ...args);
    maybeUpdateInteractionName(currentPathname);
  };
}

function maybeUpdateInteractionName(previousLocationPathname: string) {
  const rootSpan = tracing.tracer.currentRootSpan;
  // If for this interaction, the developer did not give any explicit
  // attibute (`data-ocweb-id`) and the generated name can be replaced,
  // that means the name might change to `Navigation <pathname>` as this is a
  // more understadable name for the interaction in case the location
  // pathname actually changed.
  const traceId = getTraceId(Zone.current);
  if (
    rootSpan &&
    interactionsMightChangeName.has(traceId) &&
    previousLocationPathname !== location.pathname
  ) {
    rootSpan.name = 'Navigation ' + location.pathname;
    interactionsMightChangeName.delete(traceId);
  }
}
