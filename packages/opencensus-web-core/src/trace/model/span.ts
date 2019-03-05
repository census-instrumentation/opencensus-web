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

import * as coreTypes from '@opencensus/core';

import {randomSpanId} from '../../common/id-util';
import {getDateForPerfTime} from '../../common/time-util';

import {CanonicalCode, LinkType, MessageEventType, SpanKind} from './enums';

/** Default span name if none is specified. */
const DEFAULT_SPAN_NAME = 'unnamed';

/** A span represents a single operation within a trace. */
export class Span implements coreTypes.Span {
  constructor(
      /** The ID of this span. Defaults to a random span ID. */
      public id = randomSpanId()) {}

  /** If the parent span is in another process. */
  remoteParent = false;

  /** The span ID of this span's parent. If it's a root span, must be empty */
  parentSpanId = '';

  /** Whether this span is a RootSpan */
  get isRootSpan(): boolean {
    return this.parentSpanId === '';
  }

  /** Trace id asscoiated with span. */
  traceId = '';

  /** Trace state associated with span */
  traceState: coreTypes.TraceState = '';

  /** The display name of the span. */
  name = DEFAULT_SPAN_NAME;

  /** Kind of span. */
  kind: SpanKind = SpanKind.UNSPECIFIED;

  /** An object to log information to. Logs to the JS console by default. */
  logger: coreTypes.Logger = console;

  /**
   * Status associated with this span. Defaults to OK status. Note that the
   * `code` is not an HTTP status, but is a specific trace status code. See:
   * https://github.com/census-instrumentation/opencensus-specs/blob/master/trace/HTTP.md#mapping-from-http-status-codes-to-trace-status-codes
   */
  status: coreTypes.Status = {code: CanonicalCode.OK};

  /** A set of attributes, each in the format [KEY]:[VALUE] */
  attributes: coreTypes.Attributes = {};

  /** Text annotations with a set of attributes. */
  annotations: coreTypes.Annotation[] = [];

  /** Event describing messages sent/received between Spans. */
  messageEvents: coreTypes.MessageEvent[] = [];

  /** Pointers from the current span to another span */
  links: coreTypes.Link[] = [];

  /** Start time of the span as measured by the browser performance clock. */
  startPerfTime = 0;

  /**
   * Number of dropped attributes. This is always zero because OpenCensus web
   * does not implement attribute dropping (but may be done by agent on export).
   */
  readonly droppedAttributesCount = 0;

  /** Number of dropped links. Always zero for OpenCensus web. */
  readonly droppedLinksCount = 0;

  /** Number of dropped annotations. Always zero for OpenCensus web. */
  readonly droppedAnnotationsCount = 0;

  /** Number of dropped message events. Always zero for OpenCensus web. */
  readonly droppedMessageEventsCount = 0;

  /**
   * Trace parameter configuration. Not used by OpenCensus Web, but
   * kept for interface compatibility with @opencensus/core.
   */
  readonly activeTraceParams = {};

  /** Start time of the span as a Date. */
  get startTime(): Date {
    return getDateForPerfTime(this.startPerfTime);
  }

  /**
   * Indicates if span was started. This is always true for opencensus-web for
   * code simplicity purposes but kept for interface compatibility with
   * @opencensus/core.
   */
  readonly started = true;

  /** End time of the span as measured by the browser performance clock. */
  endPerfTime = 0;

  /** End time of the span as a Date. */
  get endTime(): Date {
    return getDateForPerfTime(this.endPerfTime);
  }

  /** Indicates if span was ended. */
  get ended(): boolean {
    return this.endPerfTime > 0;
  }

  /** Span duration in milliseconds. */
  get duration(): number {
    return this.endPerfTime - this.startPerfTime;
  }

  /** Gives the TraceContext of the span. */
  get spanContext(): coreTypes.SpanContext {
    return {
      traceId: this.traceId,
      spanId: this.id,
      options: 0x1,  // always traced
      traceState: this.traceState,
    };
  }

  /**
   * Adds an attribute to the span.
   * @param key Describes the value added.
   * @param value What value to set for the attribute.
   */
  addAttribute(key: string, value: string|number|boolean) {
    this.attributes[key] = value;
  }

  /**
   * Adds an annotation to the span.
   * @param description Describes the event.
   * @param attributes A set of attributes on the annotation.
   * @param timestamp A timestamp in browser performance clock milliseconds.
   *     Defaults to `performance.now()`.
   */
  addAnnotation(
      description: string, attributes: coreTypes.Attributes = {},
      timestamp: number = performance.now()) {
    this.annotations.push({description, attributes, timestamp});
  }

  /**
   * Adds a link to the span.
   * @param traceId The trace ID for a trace within a project.
   * @param spanId The span ID for a span within a trace.
   * @param type The relationship of the current span relative to the linked.
   * @param attributes A set of attributes on the link.
   */
  addLink(
      traceId: string, spanId: string, type: LinkType,
      attributes: coreTypes.Attributes = {}) {
    this.links.push({traceId, spanId, type, attributes});
  }
  /**
   * Adds a message event to the span.
   * @param type The type of message event.
   * @param id An identifier for the message event.
   * @param timestamp A time in browser performance clock milliseconds.
   *     Defaults to `performance.now()`.
   */
  addMessageEvent(
      type: MessageEventType, id: string,
      timestamp: number = performance.now()) {
    this.messageEvents.push({type, id, timestamp});
  }

  /**
   * Sets a status to the span.
   * @param code The canonical status code.
   * @param message optional A developer-facing error message.
   */
  setStatus(code: CanonicalCode, message?: string) {
    this.status = {code, message};
  }

  /** Starts span by setting `startTime` to now. */
  start() {
    this.startPerfTime = performance.now();
  }

  /** Ends the span by setting `endTime` to now. */
  end() {
    this.endPerfTime = performance.now();
  }

  /** Forces the span to end. Same as `end` for opencensus-web. */
  truncate() {
    this.end();
  }
}
