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

import { XhrWithUrl } from './zone-types';

export function doPatching() {
  patchXmlHttpRequestOpen();
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
    (this as XhrWithUrl)._ocweb_method = method;
  };
}
