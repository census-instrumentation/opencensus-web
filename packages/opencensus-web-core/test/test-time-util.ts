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

import {
  getDateForPerfTime,
  getIsoDateStrForPerfTime,
  getPerfTimeOrigin,
} from '../src/common/time-util';
import { mockGetterOrValue, restoreGetterOrValue } from './util';

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

      expect(getPerfTimeOrigin()).toBe(1548000000000);
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
      expect(getIsoDateStrForPerfTime(0.000001)).toEqual(
        '2018-08-31T02:51:27.001000001Z'
      );
    });

    it('accurately combines milliseconds from origin and perf times', () => {
      mockGetterOrValue(performance, 'timeOrigin', 1535683887441.586);

      expect(getIsoDateStrForPerfTime(658867.8000000073)).toEqual(
        '2018-08-31T03:02:26.309385938Z'
      );
    });
  });
});
