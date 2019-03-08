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

declare type WindowWithMsCrypto = Window & {
  msCrypto?: Crypto;
};

const SPAN_ID_BYTES = 8;

/** Returns a random 16-byte trace ID formatted as a 32-char hex string. */
export function randomTraceId(): string {
  return randomSpanId() + randomSpanId();
}

/** Returns a random 8-byte span ID formatted as a 16-char hex string. */
export function randomSpanId(): string {
  // IE 11 exposes `crypto` as `msCrypto`.
  const crypto = window.crypto || (window as WindowWithMsCrypto).msCrypto;

  let spanId = '';
  const randomBytes = new Uint8Array(SPAN_ID_BYTES);
  crypto.getRandomValues(randomBytes);
  for (let i = 0; i < SPAN_ID_BYTES; i++) {
    const hexStr = randomBytes[i].toString(16);

    // Zero pad bytes whose hex values are single digit.
    if (hexStr.length === 1) spanId += '0';

    spanId += hexStr;
  }
  return spanId;
}
