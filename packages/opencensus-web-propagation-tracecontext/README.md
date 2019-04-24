# OpenCensus Trace Context format propagation for web browsers
[![Gitter chat][gitter-image]][gitter-url]

*For overview and usage info see the main [OpenCensus Web readme][oc-web-readme-url].*

OpenCensus Trace Context format propagation provides utilities to serialize and
deserialize a trace context header in the [W3C Trace Context][trace-context-url]
format.

The library is in alpha stage and the API is subject to change.

## Usage

Currently the primary intended usage of OpenCensus Web is to collect
spans from the resource timing waterfall of an initial page load. See the 
[OpenCensus Web readme][oc-web-readme-url] for details.

This package is currently used to deserialize the `window.traceparent` global
variable that the server can send back to the client to indicate the parent
trace context for the initial page load.

In the future we would like to support propagating trace contextspans for XHRs, 
and this library could be used to also serialize a `traceparent` header to send
along to XHR calls.

## Useful links
- For more information on OpenCensus, visit: <https://opencensus.io/>
- For more about OpenCensus Web: <https://github.com/census-instrumentation/opencensus-web>
- For help or feedback on this project, join us on [gitter][gitter-url]

## License

Apache 2.0 - See [LICENSE][license-url] for more information.

[gitter-image]: https://badges.gitter.im/census-instrumentation/lobby.svg
[gitter-url]: https://gitter.im/census-instrumentation/lobby
[oc-web-readme-url]: https://github.com/census-instrumentation/opencensus-web/blob/master/README.md
[license-url]: https://github.com/census-instrumentation/opencensus-web/blob/master/packages/opencensus-web-propagation-tracecontext/LICENSE
[trace-context-url]: https://www.w3.org/TR/trace-context/
