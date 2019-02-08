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

/**
 * Interface to represent the components of a parsed URL.
 * The field comments below reference this sample URL:
 *    https://example.com:3000/pathname/?search=test#hash
 */
export interface ParsedUrl {
  /** Protocol of the URL including the colon. E.g. https: */
  readonly protocol: string;
  /** Host name only (no port). E.g. example.com */
  readonly hostname: string;
  /**
   * Port number if explicitly specified (else empty string). E.g. 3000
   * This is a string type to match the type of the field in the document <a>
   * tag that is used to implement this.
   */
  readonly port: string;
  /** Host portion of the URL including port. E.g. example.com:3000 */
  readonly host: string;
  /** Origin with protocol, hostname and port. E.g. https://example.com:3000 */
  readonly origin: string;
  /** Request URL path. E.g. /pathname/ */
  readonly pathname: string;
  /** Portion of the URL after and including the `#` character. E.g. #hash */
  readonly hash: string;
  /** Query string before the `#` char including the `?`. E.g. ?search=test */
  readonly search: string;
}

/** Parses the given URL into components. */
export function parseUrl(url: string): ParsedUrl {
  const aTag = document.createElement('a');
  aTag.href = url;
  return aTag;
}
