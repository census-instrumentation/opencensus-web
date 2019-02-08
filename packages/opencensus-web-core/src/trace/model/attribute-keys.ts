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

/**
 * @fileoverview Constants for trace attribute keys. See
 *     https://github.com/census-instrumentation/opencensus-specs/blob/master/trace/HTTP.md
 */

const HTTP_PREFIX = 'http.';

// FROM OFFICIAL SPEC
/** Request URL host. E.g. example.com:779 */
export const ATTRIBUTE_HTTP_HOST = `${HTTP_PREFIX}host`;
/** Request URL method. E.g. GET */
export const ATTRIBUTE_HTTP_METHOD = `${HTTP_PREFIX}method`;
/** Request URL path. If empty - set to /. E.g. /users/25f4c31d */
export const ATTRIBUTE_HTTP_PATH = `${HTTP_PREFIX}path`;
/** Matched request URL route. E.g. /users/:userID */
export const ATTRIBUTE_HTTP_ROUTE = `${HTTP_PREFIX}route`;
/** Request user-agent. E.g. HTTPClient/1.2 */
export const ATTRIBUTE_HTTP_USER_AGENT = `${HTTP_PREFIX}user_agent`;
/** Response status code. E.g. 200 */
export const ATTRIBUTE_HTTP_STATUS_CODE = `${HTTP_PREFIX}status_code`;
/** Absolute request URL. E.g. https://example.com:779/path/12314/?q=ddds#123 */
export const ATTRIBUTE_HTTP_URL = `${HTTP_PREFIX}url`;

// NOT IN OFFICIAL SPEC

/**
 * The ALPH Protocol ID of the network protocol used to make the request. See:
 * https://www.w3.org/TR/resource-timing-2/#dom-performanceresourcetiming-nexthopprotocol
 */
export const ATTRIBUTE_HTTP_NEXT_HOP_PROTOCOL =
    `${HTTP_PREFIX}next_hop_protocol`;
/**
 * The type of resource that initiated the HTTP request. See:
 * https://www.w3.org/TR/resource-timing-2/#dom-performanceresourcetiming-initiatortype
 */
export const ATTRIBUTE_HTTP_INITIATOR_TYPE = `${HTTP_PREFIX}initiator_type`;
/**
 * The total size of the response in bytes transferred. See
 * https://www.w3.org/TR/resource-timing-2/#dom-performanceresourcetiming-transfersize
 */
export const ATTRIBUTE_HTTP_RESP_SIZE = `${HTTP_PREFIX}resp_size`;
/**
 * The size in bytes of the compressed response body. See
 * https://www.w3.org/TR/resource-timing-2/#dom-performanceresourcetiming-encodedbodysize
 */
export const ATTRIBUTE_HTTP_RESP_ENCODED_BODY_SIZE =
    `${HTTP_PREFIX}resp_encoded_body_size`;
/**
 * The size in bytes of the uncompressed response body. See
 * https://www.w3.org/TR/resource-timing-2/#dom-performanceresourcetiming-decodedbodysize
 */
export const ATTRIBUTE_HTTP_RESP_DECODED_BODY_SIZE =
    `${HTTP_PREFIX}resp_decoded_body_size`;

const NAVIGATION_PREFIX = 'nav.';

/**
 * The type of browser navigation. See
 * https://www.w3.org/TR/navigation-timing-2/#sec-performance-navigation-types
 */
export const ATTRIBUTE_NAV_TYPE = `${NAVIGATION_PREFIX}type`;
/**
 * Number of redirects since the last non-redirect navigation. See
 * https://www.w3.org/TR/navigation-timing-2/#dom-performancenavigationtiming-redirectcount
 */
export const ATTRIBUTE_NAV_REDIRECT_COUNT =
    `${NAVIGATION_PREFIX}redirect_count`;
