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

import {adjustPerfTimeOrigin, getDateForPerfTime, getIsoDateStrForPerfTime, getPerfTimeOrigin, TEST_ONLY} from '../src/common/time-util';
import {mockGetterOrValue, restoreGetterOrValue} from './util';

describe('time utils', () => {
  let realTimeOrigin: number;
  beforeEach(() => {
    realTimeOrigin = performance.timeOrigin;
  });
  afterEach(() => {
    restoreGetterOrValue(performance, 'timeOrigin', realTimeOrigin);
  });

  describe('getPerfTimeOrigin', () => {
    it('returns `performance.timeOrigin` if set', () => {
      mockGetterOrValue(performance, 'timeOrigin', 1548000000000);
      expect(getPerfTimeOrigin()).toBe(1548000000000);
    });

    it('calculates via polyfill if `performance.timeOrigin` unset', () => {
      mockGetterOrValue(performance, 'timeOrigin', undefined);
      spyOn(Date, 'now').and.returnValue(1548000009999);
      spyOn(performance, 'now').and.returnValue(9999);
    });
  });

  describe('adjustPerfTimeOrigin', () => {
    function createNavTiming({requestStart, responseStart}:
                                 {requestStart: number, responseStart: number}):
        PerformanceNavigationTiming {
      return {
        // This are used by the time adjustment function below.
        requestStart,   // Client start time in performance clock millis.
        responseStart,  // Client end time in performance clock millis.
        // These are needed to satisfy the interface.
        connectEnd: 0,
        connectStart: 0,
        decodedBodySize: 0,
        domComplete: 0,
        domContentLoadedEventEnd: 0,
        domContentLoadedEventStart: 0,
        domInteractive: 0,
        domainLookupEnd: 0,
        domainLookupStart: 0,
        duration: 0,
        encodedBodySize: 0,
        entryType: '',
        fetchStart: 0,
        initiatorType: '',
        loadEventEnd: 0,
        loadEventStart: 0,
        name: '',
        nextHopProtocol: '',
        redirectCount: 0,
        redirectEnd: 0,
        redirectStart: 0,
        responseEnd: 0,
        secureConnectionStart: 0,
        startTime: 0,
        toJSON: () => ({}),
        transferSize: 0,
        type: 'navigate',
        unloadEventEnd: 0,
        unloadEventStart: 0,
        workerStart: 0,
      };
    }

    const CLIENT_TIME_ORIGIN = 1548000000000;
    beforeEach(() => {
      mockGetterOrValue(performance, 'timeOrigin', CLIENT_TIME_ORIGIN);
    });
    afterEach(() => {
      TEST_ONLY.clearAdjustedPerfTime();
    });

    it('keeps client time origin if server time longer than client', () => {
      // Client nav fetch duration is 5ms
      const perfNavTiming =
          createNavTiming({requestStart: 10.1, responseStart: 15.1});

      // Server nav fetch duration is 10ms
      adjustPerfTimeOrigin(
          1548000001000.2, /* serverNavFetchDuration */ 10, perfNavTiming);

      expect(getPerfTimeOrigin()).toBe(CLIENT_TIME_ORIGIN);
    });

    it('adjusts origin to center server span in client span', () => {
      const clientNavFetchStartInPerfTime = 10;
      const clientNavFetchEndInPerfTime = 18;
      const perfNavTiming = createNavTiming({
        requestStart: clientNavFetchStartInPerfTime,
        responseStart: clientNavFetchEndInPerfTime,
      });
      const serverNavFetchStartEpochMillis = 1500000001000;  // Epoch millis.
      const serverNavFetchDuration = 6;                      // Duration millis

      adjustPerfTimeOrigin(
          serverNavFetchStartEpochMillis, serverNavFetchDuration,
          perfNavTiming);

      // Calculations to make the expectation clearer:
      const clientNavFetchDuration =
          clientNavFetchEndInPerfTime - clientNavFetchStartInPerfTime;
      expect(clientNavFetchDuration).toBe(8);  // Duration millis
      const networkTime = clientNavFetchDuration - serverNavFetchDuration;
      expect(networkTime).toBe(2);  // Duration millis
      const clientNavStartInEpochMillis =
          serverNavFetchStartEpochMillis - networkTime / 2;
      expect(clientNavStartInEpochMillis).toBe(1500000000999);
      const perfOriginInEpochMillis =
          clientNavStartInEpochMillis - clientNavFetchStartInPerfTime;
      expect(perfOriginInEpochMillis).toBe(1500000000989);

      expect(getPerfTimeOrigin()).toBe(perfOriginInEpochMillis);
    });
  });

  describe('getDateForPerfTime', () => {
    it('calculates date for perf time based on time origin', () => {
      mockGetterOrValue(performance, 'timeOrigin', 1548000000000);
      expect(getDateForPerfTime(999.6).getTime()).toBe(1548000000999);
    });
  });

  describe('getIsoDateStrForPerfTime', () => {
    it('converts perf time to nanosecond-precise ISO date string', () => {
      mockGetterOrValue(performance, 'timeOrigin', 1535683887001);
      expect(getIsoDateStrForPerfTime(0.000001))
          .toEqual('2018-08-31T02:51:27.001000001Z');
    });

    it('accurately combines milliseconds from origin and perf times', () => {
      mockGetterOrValue(performance, 'timeOrigin', 1535683887441.586);
      expect(getIsoDateStrForPerfTime(658867.8000000073))
          .toEqual('2018-08-31T03:02:26.309385938Z');
    });
  });
});
