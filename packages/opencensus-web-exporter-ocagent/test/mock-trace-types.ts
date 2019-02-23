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

import {Annotation, Attributes, CanonicalCode, Link, Logger, MessageEvent, RootSpan, Span, SpanContext, Status, TraceState} from '@opencensus/core';
import {LinkType, MessageEventType, SpanKind} from '@opencensus/web-core';

/** Helper interface for specifying the parameters of a MockSpan. */
export interface MockSpanParams {
  id: string;
  remoteParent?: boolean;
  parentSpanId?: string;
  name: string;
  kind?: SpanKind;
  status?: Status;
  attributes?: Attributes;
  annotations?: Annotation[];
  messageEvents?: MessageEvent[];
  links?: Link[];
  isRootSpan?: boolean;
  traceId: string;
  traceState?: TraceState;
  started?: boolean;
  ended?: boolean;
  startTime: Date;
  endTime: Date;
  spanContext?: SpanContext;
}

/** Simple mock span class for for use in unit tests. */
export class MockSpan implements Span {
  readonly id: string;
  readonly remoteParent: boolean;
  readonly parentSpanId: string;
  readonly name: string;
  readonly kind: SpanKind;
  readonly status: Status;
  readonly logger: Logger = console;
  readonly attributes: Attributes;
  readonly annotations: Annotation[];
  readonly messageEvents: MessageEvent[];
  readonly links: Link[];
  readonly isRootSpan: boolean;
  readonly traceId: string;
  readonly traceState: TraceState;
  readonly started: boolean;
  readonly ended: boolean;
  readonly startTime: Date;
  readonly endTime: Date;
  readonly spanContext: SpanContext;
  readonly activeTraceParams = {};
  readonly droppedAttributesCount = 0;
  readonly droppedAnnotationsCount = 0;
  readonly droppedLinksCount = 0;
  readonly droppedMessageEventsCount = 0;

  get duration(): number {
    return this.endTime.getTime() - this.startTime.getTime();
  }

  constructor({
    id,
    remoteParent = false,
    parentSpanId = '',
    name,
    kind = SpanKind.UNSPECIFIED,
    status = {code: 0},
    attributes = {},
    annotations = [],
    messageEvents = [],
    links = [],
    isRootSpan = false,
    traceId,
    traceState = '',
    started = true,
    ended = true,
    startTime,
    endTime,
    spanContext,
  }: MockSpanParams) {
    this.id = id;
    this.remoteParent = remoteParent;
    this.parentSpanId = parentSpanId;
    this.name = name;
    this.kind = kind;
    this.status = status;
    this.attributes = attributes;
    this.annotations = annotations;
    this.messageEvents = messageEvents;
    this.links = links;
    this.isRootSpan = isRootSpan;
    this.traceId = traceId;
    this.traceState = traceState;
    this.started = started;
    this.ended = ended;
    this.endTime = endTime;
    this.startTime = startTime;
    this.spanContext = spanContext || {spanId: id, traceId};
  }

  addAnnotation(
      description: string, attributes?: Attributes, timestamp?: number) {
    throw new Error('Not implemented');
  }

  addLink(
      traceId: string, spanId: string, type: LinkType,
      attributes?: Attributes) {
    throw new Error('Not implemented');
  }

  addAttribute(key: string, value: string) {
    throw new Error('Not implemented');
  }

  addMessageEvent(type: MessageEventType, id: string, timestamp?: number) {
    throw new Error('Not implemented');
  }

  setStatus(code: CanonicalCode, message?: string) {
    throw new Error('Not implemented');
  }

  start() {
    throw new Error('Not implemented');
  }

  end() {
    throw new Error('Not implemented');
  }

  truncate() {
    throw new Error('Not implemented');
  }
}

/** Simple mock root span for use in use tests. */
export class MockRootSpan extends MockSpan implements RootSpan {
  constructor(spanParams: MockSpanParams, readonly spans: Span[]) {
    super(spanParams);
  }

  startChildSpan(name: string, type: SpanKind): Span {
    throw new Error('Not implemented');
  }
}
