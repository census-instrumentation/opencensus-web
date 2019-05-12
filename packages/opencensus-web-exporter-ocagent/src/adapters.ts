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

import * as webCore from '@opencensus/web-core';
import * as apiTypes from './api-types';

/**
 * This is a recent time in epoch milliseconds. Timestamps before this are
 * assumed to be in browser performance clock millseconds, and timestamps after
 * it are assumed to be in epoch milliseconds.
 */
const RECENT_EPOCH_MS = 1500000000000; // July 13, 2017.

/**
 * Converts a RootSpan type from @opencensus/web-core to the Span JSON structure
 * expected by the OpenCensus Agent's HTTP/JSON (grpc-gateway) API.
 */
export function adaptRootSpan(rootSpan: webCore.RootSpan): apiTypes.Span[] {
  const adaptedSpans: apiTypes.Span[] = rootSpan.spans.map(adaptSpan);
  adaptedSpans.unshift(adaptSpan(rootSpan));
  return adaptedSpans;
}

function adaptString(value: string): apiTypes.TruncatableString {
  return { value };
}

/** Converts hexadecimal string to base64 string. */
function hexToBase64(hexStr: string): string {
  const hexStrLen = hexStr.length;
  let hexAsciiCharsStr = '';
  for (let i = 0; i < hexStrLen; i += 2) {
    const hexPair = hexStr.substring(i, i + 2);
    // tslint:disable-next-line:ban Needed to parse hexadecimal.
    const hexVal = parseInt(hexPair, 16);
    hexAsciiCharsStr += String.fromCharCode(hexVal);
  }
  return btoa(hexAsciiCharsStr);
}

function adaptTraceState(
  coreTraceState?: webCore.TraceState
): apiTypes.TraceState {
  if (!coreTraceState || !coreTraceState.length) return {};
  const entries = coreTraceState.split(',');
  const apiTraceState: apiTypes.TraceState = {};
  for (const entry of entries) {
    const [key, value] = entry.split('=');
    apiTraceState[key] = value;
  }
  return apiTraceState;
}

function adaptValue(value: boolean | string | number): apiTypes.AttributeValue {
  const valType = typeof value;
  if (valType === 'boolean') {
    return { boolValue: value as boolean };
  }
  if (valType === 'number') {
    return { doubleValue: value as number };
  }
  return { stringValue: adaptString(String(value)) };
}

function adaptAttributes(attributes: webCore.Attributes): apiTypes.Attributes {
  const attributeMap: apiTypes.AttributeMap = {};
  for (const key of Object.keys(attributes)) {
    attributeMap[key] = adaptValue(attributes[key]);
  }
  return { attributeMap };
}

function adaptAnnotation(annotation: webCore.Annotation): apiTypes.TimeEvent {
  return {
    time: adaptTimestampNumber(annotation.timestamp),
    annotation: {
      description: adaptString(annotation.description),
      attributes: adaptAttributes(annotation.attributes),
    },
  };
}

/**
 * Adapts a timestamp number for an annotation or message event. For
 * opencensus-web, those timestamps are allowed to be either in epoch
 * milliseconds or in browser performance clock milliseconds. This determines
 * which one it likely is based on the size of the number.
 * @return ISO string for timestamp
 */
function adaptTimestampNumber(timestamp: number): string {
  if (timestamp > RECENT_EPOCH_MS) {
    return new Date(timestamp).toISOString();
  }
  return webCore.getIsoDateStrForPerfTime(timestamp);
}

function adaptMessageEvent(
  messageEvent: webCore.MessageEvent
): apiTypes.TimeEvent {
  return {
    time: adaptTimestampNumber(messageEvent.timestamp),
    messageEvent: {
      // tslint:disable-next-line:ban Needed to parse hexadecimal.
      id: String(parseInt(messageEvent.id, 16)),
      type: messageEvent.type, // Enum values match proto values
      uncompressedSize: messageEvent.uncompressedSize,
      compressedSize: messageEvent.compressedSize,
    },
  };
}

function adaptTimeEvents(
  annotations: webCore.Annotation[],
  messageEvents: webCore.MessageEvent[]
): apiTypes.TimeEvents {
  return {
    timeEvent: annotations
      .map(adaptAnnotation)
      .concat(messageEvents.map(adaptMessageEvent)),
  };
}

function adaptLink(link: webCore.Link): apiTypes.Link {
  return {
    traceId: hexToBase64(link.traceId),
    spanId: hexToBase64(link.spanId),
    type: link.type, // Enum values match proto values
    attributes: adaptAttributes(link.attributes),
  };
}

function adaptLinks(links: webCore.Link[]): apiTypes.Links {
  return { link: links.map(adaptLink) };
}

/**
 * Returns an ISO date string for a span high-resolution browser performance
 * clock time when available (if the span was a `webCore.Span` instance) or
 * otherwise using the more general `@opencensus/core` Date-typed times.
 */
function adaptSpanTime(perfTime: number | undefined, fallbackTime: Date) {
  return perfTime === undefined
    ? fallbackTime.toISOString()
    : webCore.getIsoDateStrForPerfTime(perfTime);
}

/** Interface to represent that a webCore.Span may be a webCore.Span */
interface MaybeWebSpan {
  startPerfTime?: number;
  endPerfTime?: number;
  startTime: Date;
  endTime: Date;
}

function adaptSpan(span: webCore.Span): apiTypes.Span {
  // The stackTrace and childSpanCount attributes are not currently supported by
  // opencensus-web.
  return {
    traceId: hexToBase64(span.traceId),
    spanId: hexToBase64(span.id),
    tracestate: adaptTraceState(span.traceState),
    parentSpanId: hexToBase64(span.parentSpanId),
    name: adaptString(span.name),
    kind: span.kind, // Enum values match proto values.
    startTime: adaptSpanTime(
      (span as MaybeWebSpan).startPerfTime,
      span.startTime
    ),
    endTime: adaptSpanTime((span as MaybeWebSpan).endPerfTime, span.endTime),
    attributes: adaptAttributes(span.attributes),
    timeEvents: adaptTimeEvents(span.annotations, span.messageEvents),
    links: adaptLinks(span.links),
    status: span.status,
    sameProcessAsParentSpan: !span.remoteParent,
  };
}
