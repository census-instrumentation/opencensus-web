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

/**
 * Logger that writes all log messages to the JS console.
 *  This lacks the `silly` and `logLevel` properties, which are not needed in
 *  the upstream @opencensus/core Logger, but the change has not been released
 *  to NPM set.
 *  See https://github.com/census-instrumentation/opencensus-node/pull/271
 */
// tslint:disable-next-line:no-any Used to coerce `console` to Logger because
export const LOGGER = console as any as coreTypes.Logger;
