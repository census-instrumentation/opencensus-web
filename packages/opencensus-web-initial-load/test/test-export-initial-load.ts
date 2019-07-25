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

import { exportRootSpanAfterLoadEvent } from '../src/export-initial-load';
import { WindowWithInitialLoadGlobals } from '../src/types';
import { resetInitialLoadSpanContext } from '../src/initial-load-context';

const windowWithOcwGlobals = window as WindowWithInitialLoadGlobals;

describe('exportRootSpanAfterLoadEvent', () => {
  let realOcAgent: string | undefined;
  let realTraceparent: string | undefined;
  let sendSpy: jasmine.Spy;
  beforeEach(() => {
    jasmine.clock().install();
    spyOn(XMLHttpRequest.prototype, 'open');
    sendSpy = spyOn(XMLHttpRequest.prototype, 'send');
    spyOn(XMLHttpRequest.prototype, 'setRequestHeader');
    realOcAgent = windowWithOcwGlobals.ocAgent;
    realTraceparent = windowWithOcwGlobals.traceparent;
    resetInitialLoadSpanContext();
  });
  afterEach(() => {
    jasmine.clock().uninstall();
    windowWithOcwGlobals.ocAgent = realOcAgent;
    windowWithOcwGlobals.traceparent = realTraceparent;
  });

  it('does not export if agent not configured', () => {
    windowWithOcwGlobals.ocAgent = undefined;
    windowWithOcwGlobals.traceparent = undefined;

    exportRootSpanAfterLoadEvent();

    jasmine.clock().tick(300000);
    expect(XMLHttpRequest.prototype.open).not.toHaveBeenCalled();
    expect(XMLHttpRequest.prototype.send).not.toHaveBeenCalled();
  });

  it('uses trace and span ID from window.traceparent if specified', () => {
    windowWithOcwGlobals.ocAgent = 'http://agent';
    const traceId = '0af7651916cd43dd8448eb211c80319c';
    const spanId = 'b7ad6b7169203331';
    windowWithOcwGlobals.traceparent = `00-${traceId}-${spanId}-01`;

    exportRootSpanAfterLoadEvent();

    jasmine.clock().tick(300000);
    expect(XMLHttpRequest.prototype.open).toHaveBeenCalledWith(
      'POST',
      'http://agent/v1/trace'
    );
    expect(XMLHttpRequest.prototype.send).toHaveBeenCalledTimes(1);
    // Check that trace and span ID from `window.traceparent` are in body sent.
    const sendBody = sendSpy.calls.argsFor(0)[0];
    expect(sendBody).toContain(hexToBase64(traceId));
    expect(sendBody).toContain(hexToBase64(traceId));
  });

  it('does not export spans if traceparent sampling hint set to zero', () => {
    windowWithOcwGlobals.ocAgent = 'http://agent';
    windowWithOcwGlobals.traceparent =
      '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-00';

    exportRootSpanAfterLoadEvent();

    jasmine.clock().tick(300000);
    expect(XMLHttpRequest.prototype.open).not.toHaveBeenCalled();
    expect(XMLHttpRequest.prototype.send).not.toHaveBeenCalled();
  });

  it('does not export spans if traceparent unset and random is big', () => {
    spyOn(Math, 'random').and.returnValue(0.99);
    windowWithOcwGlobals.ocAgent = 'http://agent';
    windowWithOcwGlobals.traceparent = '';

    exportRootSpanAfterLoadEvent();

    jasmine.clock().tick(300000);
    expect(XMLHttpRequest.prototype.open).not.toHaveBeenCalled();
    expect(XMLHttpRequest.prototype.send).not.toHaveBeenCalled();
  });

  it('exports spans if traceparent unset and random number is small', () => {
    spyOn(Math, 'random').and.returnValue(0);
    windowWithOcwGlobals.ocAgent = 'http://agent';
    windowWithOcwGlobals.traceparent = undefined;

    exportRootSpanAfterLoadEvent();

    jasmine.clock().tick(300000);
    expect(XMLHttpRequest.prototype.open).toHaveBeenCalledWith(
      'POST',
      'http://agent/v1/trace'
    );
    expect(XMLHttpRequest.prototype.send).toHaveBeenCalled();
  });
});

/**
 * Converts bytes in a hexadecimal encoded string to base64 encoded string.
 * This is needed because the JSON proto formatting that the OC agent expects
 * (via grpc-gateway) formats trace and span IDs in base64. This helper function
 * allows matching trace/span IDs that are sent in the XHR body to the agent.
 */
function hexToBase64(hexString: string): string {
  const match = hexString.match(/\w{2}/g);
  if (!match) return '';
  return window.btoa(
    match
      .map(hexByteChars =>
        // tslint:disable-next-line:ban Needed to parse hexadecimal.
        String.fromCharCode(parseInt(hexByteChars, 16))
      )
      .join('')
  );
}
