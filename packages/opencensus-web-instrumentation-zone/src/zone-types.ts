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

import { RootSpan } from '@opencensus/web-core';

export interface AsyncTaskData extends TaskData {
  interactionId: string;
  pageView: string;
}

export type AsyncTask = Task & {
  data: AsyncTaskData;
  eventName: string;
  target: HTMLElement;
  // Allows access to the private `_zone` property of a Zone.js Task.
  _zone: Zone;
};

/** Data used to create a new OnPageInteractionStopwatch. */
export interface OnPageInteractionData {
  startLocationHref: string;
  startLocationPath: string;
  eventType: string;
  target: HTMLElement;
  rootSpan: RootSpan;
}

/** Type for `window` object with variables OpenCensus Web interacts with. */
export declare interface WindowWithOcwGlobals extends Window {
  /**
   * HTTP root URL of the agent endpoint to write traces to.
   * Example 'https://my-oc-agent-deployment.com:55678'
   */
  ocAgent?: string;
  /**
   * If the `traceparent` global variable described above is not present on the
   * `window`, then a trace sampling decision will be made randomly with the
   * specified sample rate. If not specified, a default sampling rate is used.
   */
  ocSampleRate?: number;
}
