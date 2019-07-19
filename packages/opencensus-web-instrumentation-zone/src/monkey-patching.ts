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

import { XhrWithOcWebData } from './zone-types';

export function doPatching() {
  patchXmlHttpRequestOpen();
  patchXmlHttpRequestSend();
}

// Patch the `XMLHttpRequest.open` method to add method used for the request.
// This patch is needed because Zone.js does not capture the method from XHR
// the way that it captures URL as __zone_symbol__xhrURL.
function patchXmlHttpRequestOpen() {
  const open = XMLHttpRequest.prototype.open;

  XMLHttpRequest.prototype.open = function(
    method: string,
    url: string,
    async?: boolean,
    user?: string | null,
    pass?: string | null
  ) {
    if (async) {
      open.call(this, method, url, async, user, pass);
    } else {
      open.call(this, method, url, true, null, null);
    }
    (this as XhrWithOcWebData)._ocweb_method = method;
  };
}

/**
 * Patch `send()` method to detect when it has been detected in order to
 * dispatch an event and tell the xhr-interceptor that this method has been
 * called and it can now generate the XHR span and send the traceparent header.
 * This is necessary, as the XHR span generated in the xhr interceptor should
 * be created once this method is called.
 */
function patchXmlHttpRequestSend() {
  const open = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.send = function(
    body?:
      | string
      | Document
      | Blob
      | ArrayBufferView
      | ArrayBuffer
      | FormData
      | URLSearchParams
      | ReadableStream<Uint8Array>
      | null
  ) {
    setXhrAttributeHasCalledSend(this);
    open.call(this, body);
  };
}

/**
 * Function to set attribute in the XHR that points out `send()` has been
 * called and dispatch the event before the actual `send` is called, then, the
 * readyState is still OPENED and xhr interceptor will be able to intercept it.
 *
 * This is exported to be called in testing as we want to avoid calling the
 * actual XHR's `send()`.
 */
export function setXhrAttributeHasCalledSend(xhr: XMLHttpRequest) {
  (xhr as XhrWithOcWebData)._ocweb_has_called_send = true;
  const event = new Event('readystatechange');
  xhr.dispatchEvent(event);
}
