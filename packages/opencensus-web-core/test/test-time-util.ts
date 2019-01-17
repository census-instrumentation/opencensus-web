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

import {getDateForPerfTime, getPerfTimeOrigin} from '../src/common/time-util';

describe('getPerfTimeOrigin', () => {
  it('returns `performance.timeOrigin` if set', () => {
    spyOnProperty(performance, 'timeOrigin').and.returnValue(1548000000000);

    expect(getPerfTimeOrigin()).toBe(1548000000000);
  });

  it('calculates via polyfill if `performance.timeOrigin` unset', () => {
    spyOnProperty(performance, 'timeOrigin').and.returnValue(undefined);
    spyOn(Date, 'now').and.returnValue(1548000009999);
    spyOn(performance, 'now').and.returnValue(9999);

    expect(getPerfTimeOrigin()).toBe(1548000000000);
  });
});

describe('getDateForPerfTime', () => {
  it('calculates date for perf time based on time origin', () => {
    spyOnProperty(performance, 'timeOrigin').and.returnValue(1548000000000);

    expect(getDateForPerfTime(999.6).getTime()).toBe(1548000000999);
  });
});
