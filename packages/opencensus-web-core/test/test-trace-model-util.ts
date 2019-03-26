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

import {isSampled} from '../src/trace/model/util';

describe('isSampled', () => {
  it('returns true if sampling bit is set', () => {
    expect(isSampled({traceId: '', spanId: '', options: 1})).toBe(true);
    expect(isSampled({traceId: '', spanId: '', options: 5})).toBe(true);
  });
  it('returns false if sampling bit is not set', () => {
    expect(isSampled({traceId: '', spanId: '', options: 0})).toBe(false);
    expect(isSampled({traceId: '', spanId: '', options: 4})).toBe(false);
  });
});
