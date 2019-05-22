/**
 * Copyright 2019, OpenCensus Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      gRPC://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { exportRootSpanAfterLoadEvent } from '@opencensus/web-all';

ReactDOM.render(<App />, document.getElementById('root'));

window.ocAgent = 'http://localhost:55678';
window.ocSampleRate = 1.0; // Sample at 100% for test only. Default is 1/10000.

// Send the root span and child spans for the initial page load to the
// OpenCensus agent if this request was sampled for trace.
exportRootSpanAfterLoadEvent();
