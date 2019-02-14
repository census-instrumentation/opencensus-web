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

import {Annotation} from '@opencensus/web-core';
import {PerformanceNavigationTimingExtended, PerformanceResourceTimingExtended} from './perf-types';

/**
 * Returns annotations based on fields of a performance entry.
 * @param perfEntry The performance entry with fields that are either 0 to
 *     signify missing data, or a point event value in browser performance
 *     clock time for an event that occurred e.g. `connectStart`.
 * @param annotationFields The fields to extract from the performance timing as
 *     annotations. The description of each annotation will be set to the field
 *     name.
 */
export function annotationsForPerfTimeFields(
    perfEntry: PerformanceResourceTimingExtended|
    PerformanceNavigationTimingExtended,
    annotationsFields: string[]): Annotation[] {
  const annotations: Annotation[] = [];
  for (const annotationField of annotationsFields) {
    const maybeTime = perfEntry[annotationField] as number | undefined;
    // Either a value of 0 or `undefined` represents missing data for browser
    // performance timing fields.
    if (maybeTime) {
      annotations.push(
          {timestamp: maybeTime, description: annotationField, attributes: {}});
    }
  }
  return annotations;
}
