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

/** Type for `window` object with variables OpenCensus Web interacts with. */
export declare interface WindowWithOcwGlobals extends Window {
  /**
   * HTTP root URL of the agent endpoint to write traces to.
   * Example 'https://my-oc-agent-deployment.com:55678'
   */
  ocAgent?: string;
  /**
   * For the initial page load, web browsers do not send any custom headers,
   * which means that the server will not receive trace context headers.
   * However, we still want the server side request for the initial page load to
   * be recorded as a child span of the client side web timing span. So we can
   * have servers programmatically set a `traceparent` header to give their
   * request span a parent span ID. That simulated trace c= spanConontext header can then
   * be sent back to the client as a global variable to use for setting its
   * trace ID and request load client span ID, as well as for making a sampling
   * decision.
   * This header value is in the format of
   *     [version]-[trace ID in hex]-[span ID in hex]-[trace flags]
   * For example:
   *    00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01
   * See https://www.w3.org/TR/trace-context/ for details.
   */
  traceparent?: string;
  /**
   * If the `traceparent` global variable described above is not present on the
   * `window`, then a trace sampling decision will be made randomly with the
   * specified sample rate. If not specified, a default sampling rate is used.
   */
  ocSampleRate?: number;

  /** Used to check the `Zone` presence as a global variable. */
  Zone?: Function;

  /**
   * RegExp to control what origins will the `trace context header` be sent.
   * That way the header is not added to all xhrs.
   */
  ocTraceHeaderHostRegex?: string | RegExp;
}
