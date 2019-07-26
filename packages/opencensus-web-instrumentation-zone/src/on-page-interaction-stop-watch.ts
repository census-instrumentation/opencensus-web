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

import { OnPageInteractionData } from './zone-types';
import {
  ATTRIBUTE_HTTP_URL,
  ATTRIBUTE_HTTP_USER_AGENT,
  ATTRIBUTE_HTTP_PATH,
  ATTRIBUTE_INITIAL_LOAD_TRACE_ID,
  LinkType,
} from '@opencensus/web-core';
import { getInitialLoadSpanContext } from '@opencensus/web-initial-load';

/** A helper class for tracking on page interactions. */
export class OnPageInteractionStopwatch {
  private taskCount = 0;

  constructor(private readonly data: OnPageInteractionData) {}

  incrementTaskCount() {
    this.taskCount++;
  }

  decrementTaskCount() {
    if (this.taskCount > 0) this.taskCount--;
  }

  hasRemainingTasks() {
    return this.taskCount > 0;
  }

  getTaskCount() {
    return this.taskCount;
  }

  /**
   * Stops the stopwatch. Adds root span attributes and link to the initial
   * load page, also, ends the span.
   * If has remaining tasks do not end the root span.
   */
  stopAndRecord(): void {
    if (this.hasRemainingTasks()) return;

    const rootSpan = this.data.rootSpan;
    rootSpan.addAttribute('EventType', this.data.eventType);
    rootSpan.addAttribute('TargetElement', this.data.target.tagName);
    rootSpan.addAttribute(ATTRIBUTE_HTTP_URL, this.data.startLocationHref);
    rootSpan.addAttribute(ATTRIBUTE_HTTP_PATH, this.data.startLocationPath);
    rootSpan.addAttribute(ATTRIBUTE_HTTP_USER_AGENT, navigator.userAgent);
    const initialLoadSpanContext = getInitialLoadSpanContext();
    rootSpan.addAttribute(
      ATTRIBUTE_INITIAL_LOAD_TRACE_ID,
      initialLoadSpanContext.traceId
    );
    rootSpan.addLink(
      initialLoadSpanContext.traceId,
      initialLoadSpanContext.spanId,
      LinkType.CHILD_LINKED_SPAN
    );
    rootSpan.end();
  }
}

export function startOnPageInteraction(interaction: OnPageInteractionData) {
  return new OnPageInteractionStopwatch(interaction);
}
