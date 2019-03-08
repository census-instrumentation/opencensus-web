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

import * as coreTypes from '@opencensus/core';
import {randomSpanId, randomTraceId} from '../../common/id-util';

/** Propagation implementation that does not set or get headers. */
export class NoHeadersPropagation implements coreTypes.Propagation {
  extract(getter: coreTypes.HeaderGetter): coreTypes.SpanContext|null {
    return null;
  }

  inject(setter: coreTypes.HeaderSetter, spanContext: coreTypes.SpanContext) {}

  generate(): coreTypes.SpanContext {
    return {traceId: randomTraceId(), spanId: randomSpanId()};
  }
}
