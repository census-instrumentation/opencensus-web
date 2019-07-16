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
import { XhrPerformanceResourceTiming } from '../src/zone-types';

describe('Perf Resource Timing Selector', () => {
  describe('getPerfResourceEntries', () => {
    it('Should filter by the url and ignore entries not fitting in span', () => {
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
    it('Should add cors preflight value to non overlapping entries and not add cors value to overlapping entries', () => {
      const entry1 = createFakePerfResourceEntry(
        2.100000011036173,
        5.500000011036173
      );
      const entry2 = createFakePerfResourceEntry(
        5.600000011036173,
        10.200000011036173
      );
      const entry3 = createFakePerfResourceEntry(
        8.200000011036173,
        15.500000011036173
      );
      const perfResourceEntries = [entry1, entry2, entry3];
      const filteredPerfEntries = getPossiblePerfResourceEntries(
        perfResourceEntries
      );

      const nonOverlappingEntry1 = {
        corsPreFlightRequest: entry1,
        mainRequest: entry2,
      } as XhrPerformanceResourceTiming;
      const nonOverlappingEntry2 = {
        corsPreFlightRequest: entry1,
        mainRequest: entry3,
      } as XhrPerformanceResourceTiming;
      const overlappingEntry3 = {
        corsPreFlightRequest: entry2,
        mainRequest: entry3,
      } as XhrPerformanceResourceTiming;

      expect(filteredPerfEntries.length).toBe(2);
      expect(filteredPerfEntries).toContain(nonOverlappingEntry1);
      expect(filteredPerfEntries).toContain(nonOverlappingEntry2);
      expect(filteredPerfEntries).not.toContain(overlappingEntry3);
    });

    it('Should not add cors preflight value as all the entries overlap each other', () => {
      const entry1 = createFakePerfResourceEntry(
        2.100000011036173,
        5.500000011036173
      );
      const entry2 = createFakePerfResourceEntry(
        3.500000011036173,
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

      const overlappingEntry1 = {
        mainRequest: entry1,
      } as XhrPerformanceResourceTiming;
      const overlappingEntry2 = {
        mainRequest: entry2,
      } as XhrPerformanceResourceTiming;
      const overlappingEntry3 = {
        mainRequest: entry3,
      } as XhrPerformanceResourceTiming;
      expect(filteredPerfEntries.length).toBe(3);
      expect(filteredPerfEntries).toContain(overlappingEntry1);
      expect(filteredPerfEntries).toContain(overlappingEntry2);
      expect(filteredPerfEntries).toContain(overlappingEntry3);
    });
  });

  describe('getXhrPerfomanceData', () => {
    it('Should return entry with cors preflight value as the best performance timing entry', () => {
      const entry1 = createFakePerfResourceEntry(13.1, 15.1);
      const entry2 = createFakePerfResourceEntry(14.2, 16.2);
      const entry3 = createFakePerfResourceEntry(17.1, 19.1);
      const entry4 = createFakePerfResourceEntry(18.2, 20.2);
      // Ignore this as its out of the span end time.
      const entry5 = createFakePerfResourceEntry(15.1, 40.1);
      const perfResourceEntries = [entry1, entry2, entry3, entry4, entry5];
      spyPerfEntryByType(perfResourceEntries);
      const span = createSpan(13.1, 20.3);

      const expectedXhrPerformanceData = {
        corsPreFlightRequest: entry1,
        mainRequest: entry4,
      } as XhrPerformanceResourceTiming;
      const filteredPerfEntries = getXhrPerfomanceData('/test', span);
      expect(filteredPerfEntries).toEqual(expectedXhrPerformanceData);
    });

    it('Should return entry without cors preflight value as the best entry', () => {
      const entry1 = createFakePerfResourceEntry(5.1, 20.1);
      const entry2 = createFakePerfResourceEntry(10.1, 13.1);
      const entry3 = createFakePerfResourceEntry(14.2, 20.0);

      const perfResourceEntries = [entry1, entry2, entry3];
      spyPerfEntryByType(perfResourceEntries);

      const span = createSpan(5.1, 20.2);
      const filteredPerfEntries = getXhrPerfomanceData('/test', span);
      const expectedXhrPerformanceData = {
        mainRequest: entry1,
      } as XhrPerformanceResourceTiming;
      expect(filteredPerfEntries).toEqual(expectedXhrPerformanceData);
    });
  });
});

function createSpan(startTime: number, endTime: number): Span {
  const span = new Span();
  span.startPerfTime = startTime;
  span.endPerfTime = endTime;
  return span;
}
