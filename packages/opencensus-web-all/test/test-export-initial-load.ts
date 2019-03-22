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

import {exportRootSpanAfterLoadEvent} from '../src/export-initial-load';
import {WindowWithOcwGlobals} from '../src/types';

const windowWithOcwGlobals = window as WindowWithOcwGlobals;

describe('exportRootSpanAfterLoadEvent', () => {
  let realOcwAgent: string|undefined;
  beforeEach(() => {
    jasmine.clock().install();
    spyOn(XMLHttpRequest.prototype, 'open');
    spyOn(XMLHttpRequest.prototype, 'send');
    spyOn(XMLHttpRequest.prototype, 'setRequestHeader');
    realOcwAgent = windowWithOcwGlobals.ocwAgent;
  });
  afterEach(() => {
    jasmine.clock().uninstall();
    windowWithOcwGlobals.ocwAgent = realOcwAgent;
  });

  it('exports spans to agent if agent is configured', () => {
    windowWithOcwGlobals.ocwAgent = 'http://agent';
    exportRootSpanAfterLoadEvent();
    jasmine.clock().tick(300000);
    expect(XMLHttpRequest.prototype.open)
        .toHaveBeenCalledWith('POST', 'http://agent/v1/trace');
    expect(XMLHttpRequest.prototype.send).toHaveBeenCalled();
  });

  it('does not export if agent not configured', () => {
    windowWithOcwGlobals.ocwAgent = undefined;
    exportRootSpanAfterLoadEvent();
    jasmine.clock().tick(300000);
    expect(XMLHttpRequest.prototype.open).not.toHaveBeenCalled();
    expect(XMLHttpRequest.prototype.send).not.toHaveBeenCalled();
  });
});
