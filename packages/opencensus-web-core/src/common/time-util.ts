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

let perfOriginPolyfill = 0;

/** Returns the origin of the browser performance clock in epoch millis. */
export function getPerfTimeOrigin(): number {
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
