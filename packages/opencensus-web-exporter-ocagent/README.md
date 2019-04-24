# OpenCensus Web exporter for the OpenCensus Agent
[![Gitter chat][gitter-image]][gitter-url]

*For overview and usage info see the main [OpenCensus Web readme][oc-web-readme-url].*

This OpenCensus Web agent exporter allows browser clients to send traces to the 
[OpenCensus Agent][opencensus-service-url] via HTTP/JSON, which is the [agent
supports][oc-agent-http-url] via `grpc-gateway`.

The library is in alpha stage and the API is subject to change.

## Overview

This package converts spans from the OpenCensus Web core trace model into the
JSON that the OpenCensus Agent expects and sends an XHR to the agent to export
the traces. For the shape of the HTTP/JSON API that the OpenCensus Agent 
expects traces to be sent in, see this
[auto-generated OpenAPi document for it][trace-openapi-url].

## Usage

Currently the primary intended usage of OpenCensus Web is to collect
spans from the resource timing waterfall of an initial page load. See the 
[OpenCensus Web readme][oc-web-readme-url] for details.

In the future we would like to make it easy to generate custom spans that will
be conveniently exported to the [OpenCensus Agent][opencensus-service-url]. This
package provides the exporter needed to hook up those custom generated spans to
be sent to the agent and ultimately then to a trace storage backend. Although
it's not fully wired up and supported yet, you're welcome to poke around the
source code and try to use it!

## Useful links
- For more information on OpenCensus, visit: <https://opencensus.io/>
- For more about OpenCensus Web: <https://github.com/census-instrumentation/opencensus-web>
- For help or feedback on this project, join us on [gitter][gitter-url]

## License

Apache 2.0 - See [LICENSE][license-url] for more information.

[gitter-image]: https://badges.gitter.im/census-instrumentation/lobby.svg
[gitter-url]: https://gitter.im/census-instrumentation/lobby
[oc-web-readme-url]: https://github.com/census-instrumentation/opencensus-web/blob/master/README.md
[license-url]: https://github.com/census-instrumentation/opencensus-web/blob/master/packages/opencensus-web-exporter-ocagent/LICENSE
[opencensus-service-url]: https://github.com/census-instrumentation/opencensus-service
[oc-agent-http-url]: https://github.com/census-instrumentation/opencensus-service/blob/master/receiver/README.md#writing-with-httpjson
[trace-openapi-url]: https://github.com/census-instrumentation/opencensus-proto/blob/master/gen-openapi/opencensus/proto/agent/trace/v1/trace_service.swagger.json
