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

import {randomSpanId, randomTraceId} from '../src/common/id-util';

const NUM_VERIFY_TRIALS = 10;

function verifyGeneratesHexStringsOfLength(
    generateFn: () => string, expectedLen: number) {
  const allHexStrs = new Set<string>();
  for (let i = 0; i < NUM_VERIFY_TRIALS; i++) {
    const hexStr = generateFn();
    expect(hexStr).toMatch(/^[a-f0-9]+$/);
    expect(hexStr.length).toBe(expectedLen);
    allHexStrs.add(hexStr);
  }
  // Verify that all generated strings were distinct.
  expect(allHexStrs.size).toBe(NUM_VERIFY_TRIALS);
}

describe('randomTraceId', () => {
  it('returns different 32-char hex strings', () => {
    verifyGeneratesHexStringsOfLength(randomTraceId, /* expectedLen */ 32);
  });
});

describe('randomSpanId', () => {
  it('returns different 16-char hex strings', () => {
    verifyGeneratesHexStringsOfLength(randomSpanId, /* expectedLen */ 16);
  });
});
