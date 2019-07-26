# OpenCensus Web Initial Load
[![Gitter chat][gitter-image]][gitter-url]

*For overview and usage info see the main [OpenCensus Web readme][oc-web-readme-url].*

This package contains the logic for the initial load page tracing.

The library is in alpha stage and the API is subject to change.

## Usage

Currently the primary intended usage of OpenCensus Web is to collect
spans from the resource timing waterfall of an initial page load. See the 
[OpenCensus Web readme][oc-web-readme-url] for details.

This package is currently exporting the trace associated to the initial load trace.
Additionally, the sampling decision for OpenCensus Web is done here and a global
initial load span context is stored to be passed around. This allows other packages to
use the same sampling decision or relate their data to the initial load trace. This is the
case for a `@opencensus/web-instrumentation-zone`.

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
