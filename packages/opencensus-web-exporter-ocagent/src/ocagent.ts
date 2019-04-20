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

import {Exporter, ExporterConfig, RootSpan, VERSION} from '@opencensus/web-core';

import {adaptRootSpan} from './adapters';
import * as apiTypes from './api-types';
import {ExporterBuffer} from './exporter-buffer';
import {EXPORTER_VERSION} from './version';

/**
 * Enum value for LibraryInfo.Language that indicates to the OpenCensus Agent
 * that the generated spans/metrics are from the Web JS OpenCensus libary. See:
 * https://github.com/census-instrumentation/opencensus-proto/blob/master/src/opencensus/proto/agent/common/v1/common.proto
 */
const WEB_JS_LIBRARY_LANGUAGE: apiTypes.LanguageWebJs = 10;

// The value of XMLHttpRequest `readyState` property when the request is done.
const XHR_READY_STATE_DONE = 4;

/** Options for OpenCensus Agent Exporter configuration. */
export interface OCAgentExporterOptions extends ExporterConfig {
  /**
   * HTTP endpoint of the OpenCensus agent to send traces, e.g.
   * "https://my-server.com/oc-agent"
   */
  agentEndpoint: string;
  /**
   * Name of the web application that will be writing traces. This value will
   * be associated with traces via the `ServiceInfo` section of the `Node`
   * object that is written to the agent.
   */
  serviceName?: string;
  /**
   * Attributes about the web application writing the traces. This will be set
   * in the `attributes` field of the `Node` object written to the agent.
   */
  attributes?: {[key: string]: string};
}

/**
 * Format and send span information to the OpenCensus Agent. Also receives and
 * applies configuration changes from the Agent.
 */
export class OCAgentExporter implements Exporter {
  private buffer: ExporterBuffer;

  constructor(private readonly config: OCAgentExporterOptions) {
    this.buffer = new ExporterBuffer(this, config);
  }

  /**
   * Sends a list of root spans to the service.
   * @param rootSpans A list of root spans to publish.
   */
  publish(roots: RootSpan[]): Promise<number|string|void> {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', this.config.agentEndpoint);
    xhr.setRequestHeader('Content-Type', 'application/json');
    const request = this.getExportSpansRequest(roots);
    xhr.send(JSON.stringify(request));

    return new Promise((resolve) => {
      xhr.onreadystatechange = () => {
        if (xhr.readyState === XHR_READY_STATE_DONE) resolve(xhr.status);
      };
    });
  }

  onStartSpan(root: RootSpan) {}

  /**
   * Indicates that a root span is complete and ready to be exported. It will
   * e added to a buffer that gets flushed when it reaches a specified size or
   * timeout.
   */
  onEndSpan(root: RootSpan) {
    this.buffer.addToBuffer(root);
  }

  private getExportSpansRequest(roots: RootSpan[]):
      apiTypes.ExportTraceServiceRequest {
    let spans: apiTypes.Span[] = [];
    for (const root of roots) {
      spans = spans.concat(adaptRootSpan(root));
    }
    return {spans, node: this.getNodeForExport()};
  }

  private getNodeForExport(): apiTypes.Node {
    return {
      identifier: {hostName: location.host},
      serviceInfo: {name: this.config.serviceName},
      libraryInfo: {
        language: WEB_JS_LIBRARY_LANGUAGE,
        exporterVersion: EXPORTER_VERSION,
        coreLibraryVersion: VERSION,
      },
      attributes: this.config.attributes,
    };
  }
}
