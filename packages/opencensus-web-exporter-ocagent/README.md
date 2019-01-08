# OpenCensus Agent Exporter for web browser clients

The OpenCensus Agent Exporter allows browser clients to send traces to the via
HTTP/JSON. This is possible now that the OpenCensus Agent supports
`grpc-gateway` for writing traces (see 
[relevant PR](https://github.com/census-instrumentation/opencensus-service/pull/270)).


This project is still at an early stage of development, it's subject to change.

For the shape of the HTTP/JSON API, see the [auto-generated OpenAPi document for
it](https://github.com/census-instrumentation/opencensus-proto/blob/master/gen-openapi/opencensus/proto/agent/trace/v1/trace_service.swagger.json).

This package has a dev dependency on the 
[@opencensus/core](https://www.npmjs.com/package/@opencensus/core) package that
was written for the
[OpenCensus Node](https://github.com/census-instrumentation/opencensus-node)
library. That dev dependency allows the library to conform to the same
interfaces provided in `@opencensus/core`, but it uses Webpack to prevent any of
the Node.js specific dependencies from being included in the generated code
for it.
