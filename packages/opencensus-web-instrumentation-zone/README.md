# OpenCensus Web instrumentation zone for user interaction tracing
[![Gitter chat][gitter-image]][gitter-url]

*For overview and usage info see the main [OpenCensus Web readme][oc-web-readme-url].*

This package generates OpencCensus Web model spans based base on user interactions 
coming after initial page loads. This implements the library 
[Zone.js](https://github.com/angular/zone.js/) to generate those spans.

The library is in alpha stage and the API is subject to change.

## Usage

Currently the primary intended usage of OpenCensus Web is to collect
spans from the resource timing waterfall of an initial page load. See the 
[OpenCensus Web readme][oc-web-readme-url] for details.

## Useful links
- For more information on OpenCensus, visit: <https://opencensus.io/>
- For more about OpenCensus Web: <https://github.com/census-instrumentation/opencensus-web>
- For help or feedback on this project, join us on [gitter][gitter-url]

## License

Apache 2.0 - See [LICENSE][license-url] for more information.

[gitter-image]: https://badges.gitter.im/census-instrumentation/lobby.svg
[gitter-url]: https://gitter.im/census-instrumentation/lobby
[oc-web-readme-url]: https://github.com/census-instrumentation/opencensus-web/blob/master/README.md
[license-url]: https://github.com/census-instrumentation/opencensus-web/blob/master/packages/opencensus-web-instrumentation-perf/LICENSE
[nav-timing-url]: https://www.w3.org/TR/navigation-timing-2/
[resource-timing-url]: https://www.w3.org/TR/resource-timing-2/
[long-tasks-url]: https://w3c.github.io/longtasks/
