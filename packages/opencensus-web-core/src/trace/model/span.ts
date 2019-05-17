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

import * as webTypes from '@opencensus/web-types';

import { randomSpanId } from '../../common/id-util';
import { getDateForPerfTime } from '../../common/time-util';

/** Default span name if none is specified. */
const DEFAULT_SPAN_NAME = 'unnamed';

/** A span represents a single operation within a trace. */
export class Span implements webTypes.Span {
  constructor(
    /** The ID of this span. Defaults to a random span ID. */
    public id = randomSpanId()
  ) {
    this.numberOfChildrenLocal = 0;
  }

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
  traceState: webTypes.TraceState = '';

  /** The display name of the span. */
  name = DEFAULT_SPAN_NAME;

  /** Kind of span. */
  kind: webTypes.SpanKind = webTypes.SpanKind.UNSPECIFIED;

  /** An object to log information to. Logs to the JS console by default. */
  logger: webTypes.Logger = console;

  /**
   * Status associated with this span. Defaults to OK status. Note that the
   * `code` is not an HTTP status, but is a specific trace status code. See:
   * https://github.com/census-instrumentation/opencensus-specs/blob/master/trace/HTTP.md#mapping-from-http-status-codes-to-trace-status-codes
   */
  status: webTypes.Status = { code: webTypes.CanonicalCode.OK };

  /** A set of attributes, each in the format [KEY]:[VALUE] */
  attributes: webTypes.Attributes = {};

  /** Text annotations with a set of attributes. */
  annotations: webTypes.Annotation[] = [];

  /** Event describing messages sent/received between Spans. */
  messageEvents: webTypes.MessageEvent[] = [];

  /** Pointers from the current span to another span */
  links: webTypes.Link[] = [];

  /** Start time of the span as measured by the browser performance clock. */
  startPerfTime = 0;

  /** A list of child spans. */
  spans: Span[] = [];

  /** A number of children. */
  private numberOfChildrenLocal: number;

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
   * kept for interface compatibility with @opencensus/web-types.
   */
  readonly activeTraceParams = {};

  /** Start time of the span as a Date. */
  get startTime(): Date {
    return getDateForPerfTime(this.startPerfTime);
  }

  /**
   * Indicates if span was started. This is always true for opencensus-web for
   * code simplicity purposes but kept for interface compatibility with
   * @opencensus/web-types.
   */
  readonly started = true;

  /** End time of the span as measured by the browser performance clock. */
  endPerfTime = 0;

  /** Gets the number of child span created for this span. */
  get numberOfChildren(): number {
    return this.numberOfChildrenLocal;
  }

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
  get spanContext(): webTypes.SpanContext {
    return {
      traceId: this.traceId,
      spanId: this.id,
      options: 0x1, // always traced
      traceState: this.traceState,
    };
  }

  /** Recursively gets the descendant spans. */
  allDescendants(): webTypes.Span[] {
    return this.spans.reduce((acc: webTypes.Span[], cur) => {
      acc.push(cur);
      const desc = cur.allDescendants();
      acc = acc.concat(desc);
      return acc;
    }, []);
  }

  /**
   * Starts a new child span.
   * @param nameOrOptions Span name string or SpanOptions object.
   * @param kind Span kind if not using options object.
   * @param parentSpanId Span parent ID.
   */
  startChildSpan(
    nameOrOptions?: string | webTypes.SpanOptions,
    kind?: webTypes.SpanKind
  ): Span {
    this.numberOfChildrenLocal++;
    const child = new Span();
    child.traceId = this.traceId;
    child.traceState = this.traceState;

    const spanName =
      typeof nameOrOptions === 'object' ? nameOrOptions.name : nameOrOptions;
    const spanKind =
      typeof nameOrOptions === 'object' ? nameOrOptions.kind : kind;
    if (spanName) child.name = spanName;
    if (spanKind) child.kind = spanKind;

    child.start();
    child.parentSpanId = this.id;
    this.spans.push(child);
    return child;
  }

  /**
   * Adds an attribute to the span.
   * @param key Describes the value added.
   * @param value What value to set for the attribute. If the value is a typeof object
   *        it has to be JSON.stringify-able, cannot contain circular dependencies.
   */
  addAttribute(key: string, value: string | number | boolean | object) {
    const serializedValue =
      typeof value === 'object' ? JSON.stringify(value) : value;
    this.attributes[key] = serializedValue;
  }

  /**
   * Adds an annotation to the span.
   * @param description Describes the event.
   * @param attributes A set of attributes on the annotation.
   * @param timestamp A timestamp in browser performance clock milliseconds.
   *     Defaults to `performance.now()`.
   */
  addAnnotation(
    description: string,
    attributes: webTypes.Attributes = {},
    timestamp: number = performance.now()
  ) {
    this.annotations.push({ description, attributes, timestamp });
  }

  /**
   * Adds a link to the span.
   * @param traceId The trace ID for a trace within a project.
   * @param spanId The span ID for a span within a trace.
   * @param type The relationship of the current span relative to the linked.
   * @param attributes A set of attributes on the link.
   */
  addLink(
    traceId: string,
    spanId: string,
    type: webTypes.LinkType,
    attributes: webTypes.Attributes = {}
  ) {
    this.links.push({ traceId, spanId, type, attributes });
  }
  /**
   * Adds a message event to the span.
   * @param type The type of message event.
   * @param id An identifier for the message event.
   * @param timestamp A time in browser performance clock milliseconds.
   *     Defaults to `performance.now()`.
   */
  addMessageEvent(
    type: webTypes.MessageEventType,
    id: number,
    timestamp: number = performance.now(),
    uncompressedSize?: number,
    compressedSize?: number
  ) {
    this.messageEvents.push({
      type,
      id,
      timestamp,
      uncompressedSize,
      compressedSize,
    });
  }

  /**
   * Sets a status to the span.
   * @param code The canonical status code.
   * @param message optional A developer-facing error message.
   */
  setStatus(code: webTypes.CanonicalCode, message?: string) {
    this.status = { code, message };
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
