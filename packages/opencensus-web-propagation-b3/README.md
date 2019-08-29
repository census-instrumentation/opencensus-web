# OpenCensus B3 format propagation for web browsers
[![Gitter chat][gitter-image]][gitter-url]

*For overview and usage info see the main [OpenCensus Web readme][oc-web-readme-url].*

OpenCensus B3 format propagation provides utilities to serialize and
deserialize a trace context header in the [B3 Format][b3-propagation-url]
format.

The library is in alpha stage and the API is subject to change.

## Usage

Currently the primary intended usage of OpenCensus Web is to collect
spans from the resource timing waterfall of an initial page load
and trace on-page user interactions with a series of features like automatic tracing 
for *clicks* and *route transitions*, *custom spans*, and browser [Performance API][performance-api] data.
See the [OpenCensus Web readme][oc-web-readme-url] for details.

This is used to propagate trace contextspans for XHRs in the user interactions, 
serializing a `B3` headers to send along to XHR calls.

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
[b3-propagation-url]: https://github.com/openzipkin/b3-propagation
