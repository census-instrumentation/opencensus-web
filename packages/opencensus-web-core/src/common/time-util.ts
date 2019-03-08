/**
 * Copyright 2019, OpenCensus Authors
 *
 * Licensed under the Apache License, Version 2.0 the "License";
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

/** Polyfill value of `performance.timeOrigin` for browser that lack support. */
let perfOriginPolyfill = 0;
/** If non-zero, the approximate peformance clock origin in server time. */
let perfOriginInServerTime = 0;

/**
 * Returns the origin of the browser performance clock in epoch millis.
 * This can be adjusted to align more closely with the server's clock using the
 * `adjustPerfTimeOrigin` function.
 */
export function getPerfTimeOrigin(): number {
  return perfOriginInServerTime ? perfOriginInServerTime :
                                  getClientPerfTimeOrigin();
}

/**
 * Adjusts the performance clock time origin based on server clock times for the
 * start and duration of the navigation fetch (the initial HTML load request).
 *
 * This adjusts the client clock such that the network time is evenly spread on
 * both sides of the request, so that the server's span will be positioned right
 * in the middle of the client's span. This enables visualizing the server and
 * client spans no the same timeline even if they have clock skew.
 *
 * @param serverNavFetchStartTime The server's measurement of the request start
 *     in epoch milliseconds from the server clock. This would be sent back to
 *     the client in a <script> in the rendered HTML.
 * @param serverNavFetchDuration The server's measurement of the request
 *     duration in milliseconds. This would also be sent to the client.
 * @param perfNavTiming The performance navigation timing, which can be
 *     retrieved by `performance.getEntriesByType('navigation')[0]`, provided
 *     that the browser supports it.
 */
export function adjustPerfTimeOrigin(
    serverNavFetchStartTime: number, serverNavFetchDuration: number,
    perfNavTiming: PerformanceNavigationTiming) {
  const clientStart = perfNavTiming.requestStart;
  const clientEnd = perfNavTiming.responseStart;
  const clientNavFetchDuration = clientEnd - clientStart;

  // Server time is more than client time, which we don't expect, so don't try
  // to adjust the time origin.
  if (serverNavFetchDuration > clientNavFetchDuration) return;

  const networkTime = clientNavFetchDuration - serverNavFetchDuration;
  const halfNetworkTime = networkTime / 2;
  const clientStartInServerTime = serverNavFetchStartTime - halfNetworkTime;
  perfOriginInServerTime = clientStartInServerTime - clientStart;
}

/** Helper function used for testing. */
function clearAdjustedPerfTime() {
  perfOriginInServerTime = 0;
}

function getClientPerfTimeOrigin() {
  if (performance.timeOrigin) return performance.timeOrigin;
  if (!perfOriginPolyfill) {
    perfOriginPolyfill = Date.now() - performance.now();
  }
  return perfOriginPolyfill;
}

/** Converts a browser performance timestamp into a Date. */
export function getDateForPerfTime(perfTime: DOMHighResTimeStamp): Date {
  return new Date(getPerfTimeOrigin() + perfTime);
}

/**
 * Converts a time in browser performance clock milliseconds into a nanosecond
 * precision ISO date string.
 */
export function getIsoDateStrForPerfTime(perfTime: number): string {
  // Break origin and perf times into whole and fractional parts.
  const [originWhole, originFrac] = wholeAndFraction(getPerfTimeOrigin());
  const [perfWhole, perfFrac] = wholeAndFraction(perfTime);

  // Combine the fractional and whole parts separately to preserve precision.
  const totalFrac = originFrac + perfFrac;
  const [extraWholeMs, fracMs] = wholeAndFraction(totalFrac);
  const wholeMs = originWhole + perfWhole + extraWholeMs;

  // Use native Date class to get ISO string for the whole number milliseconds.
  const dateStrWholeMs = new Date(wholeMs).toISOString();

  // Append the fractional millisecond for the final 6 digits of the ISO date.
  const dateStrWithoutZ = dateStrWholeMs.replace('Z', '');
  const millisFracStr = fracMs.toFixed(6).substring(2);
  return `${dateStrWithoutZ}${millisFracStr}Z`;
}

/** Splits a number into whole and fractional parts. */
function wholeAndFraction(num: number): [number, number] {
  const whole = Math.floor(num);
  const fraction = num - whole;
  return [whole, fraction];
}

export const TEST_ONLY = {clearAdjustedPerfTime};
