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

import { Span } from '@opencensus/web-core';
import {
  getPerfResourceEntries,
  getPossiblePerfResourceEntries,
  getXhrPerfomanceData,
} from '../src/perf-resource-timing-selector';
import { spyPerfEntryByType, createFakePerfResourceEntry } from './util';

describe('Perf Resource Timing Selector', () => {
  describe('getPerfResourceEntries', () => {
    it('Should filter properly the resource entries', () => {
      // Should ignore this as it has a different name
      const entry1 = createFakePerfResourceEntry(
        13.100000011036173,
        15.100000011036173,
        '/different_url'
      );
      const entry2 = createFakePerfResourceEntry(
        14.100000011036173,
        15.200000011036173
      );
      const entry3 = createFakePerfResourceEntry(
        16.100000011036173,
        18.100000011036173
      );
      // Should ignore this even if the end times are close.
      const entry4 = createFakePerfResourceEntry(
        20.100000011036173,
        30.000000000000003
      );
      // Ignore this as its out of the span end time.
      const entry5 = createFakePerfResourceEntry(
        35.100000011036173,
        40.100000011036173
      );
      const perfResourceEntries = [entry1, entry2, entry3, entry4, entry5];
      spyPerfEntryByType(perfResourceEntries);
      const span = createSpan(12, 30);

      const entriesToBeFiltered = [entry2, entry3];
      const filteredPerfEntries = getPerfResourceEntries('/test', span);
      expect(filteredPerfEntries).toEqual(entriesToBeFiltered);
    });
  });

  describe('getPossiblePerfResourceEntries', () => {
    it('Should pair no overlapping entries', () => {
      const entry1 = createFakePerfResourceEntry(
        2.100000011036173,
        5.500000011036173
      );
      const entry2 = createFakePerfResourceEntry(
        5.500000011036173,
        10.200000011036173
      );
      const entry3 = createFakePerfResourceEntry(
        8.200000011036173,
        15.500000011036173
      );
      const entry4 = createFakePerfResourceEntry(
        13.500000011036173,
        20.000000000000003
      );
      const perfResourceEntries = [entry1, entry2, entry3, entry4];
      const filteredPerfEntries = getPossiblePerfResourceEntries(
        perfResourceEntries
      );

      expect(filteredPerfEntries.length).toBe(3);
      // Entry1 and entry2 overlap as entry1 startTime is equal to entry2
      // endTime.
      expect(filteredPerfEntries).not.toContain([entry1, entry2]);
      expect(filteredPerfEntries).toContain([entry1, entry3]);
      expect(filteredPerfEntries).toContain([entry1, entry4]);
      expect(filteredPerfEntries).not.toContain([entry2, entry3]);
      expect(filteredPerfEntries).toContain([entry2, entry4]);
      expect(filteredPerfEntries).not.toContain([entry3, entry4]);
    });

    it('Should take single resource timing entries', () => {
      const entry1 = createFakePerfResourceEntry(
        2.100000011036173,
        5.500000011036173
      );
      const entry2 = createFakePerfResourceEntry(
        5.500000011036173,
        10.200000011036173
      );
      const entry3 = createFakePerfResourceEntry(
        1.500000011036173,
        20.000000000000003
      );
      const perfResourceEntries = [entry1, entry2, entry3];
      const filteredPerfEntries = getPossiblePerfResourceEntries(
        perfResourceEntries
      );
      expect(filteredPerfEntries.length).toBe(3);
      expect(filteredPerfEntries).toContain(entry1);
      expect(filteredPerfEntries).toContain(entry2);
      expect(filteredPerfEntries).toContain(entry3);
    });

    it('Should take single and tuples of resource timing entries', () => {
      const entry1 = createFakePerfResourceEntry(
        2.100000011036173,
        5.500000011036173
      );
      const entry2 = createFakePerfResourceEntry(
        6.500000011036173,
        10.200000011036173
      );
      const entry3 = createFakePerfResourceEntry(
        8.500000011036173,
        20.000000000000003
      );
      const entry4 = createFakePerfResourceEntry(
        1.500000011036173,
        25.000000000000003
      );
      const perfResourceEntries = [entry1, entry2, entry3, entry4];
      const filteredPerfEntries = getPossiblePerfResourceEntries(
        perfResourceEntries
      );
      expect(filteredPerfEntries.length).toBe(3);
      expect(filteredPerfEntries).toContain([entry1, entry2]);
      expect(filteredPerfEntries).toContain([entry1, entry3]);
      expect(filteredPerfEntries).not.toContain([entry1, entry4]);
      expect(filteredPerfEntries).not.toContain([entry2, entry3]);
      expect(filteredPerfEntries).not.toContain([entry2, entry4]);
      // Should not contain the single resource entries as they already were
      // paired.
      expect(filteredPerfEntries).not.toContain(entry1);
      expect(filteredPerfEntries).not.toContain(entry2);
      expect(filteredPerfEntries).not.toContain(entry3);
      // As entry4 has not been paired, should contain this a single entry.
      expect(filteredPerfEntries).toContain(entry4);
    });
  });

  describe('getXhrPerfomanceData', () => {
    it('Should take the tuple with the minimum gap to the span as the best resource timing entry', () => {
      const entry1 = createFakePerfResourceEntry(
        13.100000011036173,
        15.100000011036173
      );
      const entry2 = createFakePerfResourceEntry(
        13.200000011036173,
        15.200000011036173
      );
      const entry3 = createFakePerfResourceEntry(
        16.100000011036173,
        18.100000011036173
      );
      const entry4 = createFakePerfResourceEntry(
        16.200000011036173,
        18.200000011036173
      );
      // Ignore this as its out of the span end time.
      const entry5 = createFakePerfResourceEntry(
        35.100000011036173,
        40.100000011036173
      );
      const perfResourceEntries = [entry1, entry2, entry3, entry4, entry5];
      spyPerfEntryByType(perfResourceEntries);
      const span = createSpan(13.1, 18.3);

      const filteredPerfEntries = getXhrPerfomanceData('/test', span);
      expect(filteredPerfEntries).toEqual([entry1, entry4]);
    });

    it('Should take the single resource entry with the minimum gap to the span as the best entry', () => {
      const entry1 = createFakePerfResourceEntry(
        5.100000011036173,
        20.100000011036173
      );
      const entry2 = createFakePerfResourceEntry(
        10.100000011036173,
        13.100000011036173
      );
      const entry3 = createFakePerfResourceEntry(
        14.200000011036173,
        20.000000011036173
      );

      const perfResourceEntries = [entry1, entry2, entry3];
      spyPerfEntryByType(perfResourceEntries);

      const span = createSpan(5.1, 20.2);
      const filteredPerfEntries = getXhrPerfomanceData('/test', span);
      expect(filteredPerfEntries).toEqual(entry1);
    });
  });
});

function createSpan(startTime: number, endTime: number): Span {
  const span = new Span();
  span.startPerfTime = startTime;
  span.endPerfTime = endTime;
  return span;
}
