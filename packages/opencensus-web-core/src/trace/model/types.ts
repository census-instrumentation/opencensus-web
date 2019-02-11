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

// TODO(draffensperger): Remove these once the new @opencensus/core version is
// pushed that has these enums/fields natively.

/**
 * Type of span. Can be used to specify additional relationships between spans
 * in addition to a parent/child relationship.
 */
export enum SpanKind {
  UNSPECIFIED = '',
  /**
   * Indicates that the span covers server-side handling of an RPC or other
   * remote network request.
   */
  SERVER = 'SERVER',
  /**
   * Indicates that the span covers the client-side wrapper around an RPC or
   * other remote request.
   */
  CLIENT = 'CLIENT',
}

/**
 * The relationship of the current span relative to the linked span: child,
 * parent, or unspecified.
 */
export enum LinkType {
  /**
   * The relationship of the two spans is unknown, or known but other than
   * parent-child.
   */
  UNSPECIFIED = '',
  /** The linked span is a child of the current span */
  CHILD_LINKED_SPAN = 'CHILD_LINKED_SPAN',

  /** The linked span is a parent of the current span. */
  PARENT_LINKED_SPAN = 'PARENT_LINKED_SPAN',
}

/** Indicates whether the message was sent or received. */
export enum MessageEventType {
  /** Unknown event type. */
  UNSPECIFIED = '',
  /** Indicates a sent message. */
  SENT = 'SENT',
  /** Indicates a received message. */
  RECEIVED = 'RECEIVED',
}

/**
 * An event describing a message sent/received between Spans.
 */
export interface MessageEvent {
  /** A timestamp for the event. */
  timestamp: number;
  /** Indicates whether the message was sent or received. */
  type: string;
  /** An identifier for the MessageEvent's message. */
  id: string;
  /** The number of uncompressed bytes sent or received. */
  uncompressedSize?: number;
  /**
   * The number of compressed bytes sent or received. If zero or
   * undefined, assumed to be the same size as uncompressed.
   */
  compressedSize?: number;
}
