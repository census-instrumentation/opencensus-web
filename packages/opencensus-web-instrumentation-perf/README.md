# OpenCensus Web instrumentation for web performance APIs
[![Gitter chat][gitter-image]][gitter-url]

*For overview and usage info see the main [OpenCensus Web readme][oc-web-readme-url].*

This package generates OpenCensus Web trace model spans based on performance API
data provided by the browser. Specifically, it generates spans for the initial
page load of a site based on the [Resource Timing][resource-timing-url],
[Navigation Timing][nav-timing-url], and [Long Task][long-tasks-url] browser
APIs. It attempts to gracefully degrade for older browsers that do not support
those timing APIs, but it has not been tested yet for browser compatibility.

The library is in alpha stage and the API is subject to change.

## Usage

Currently the primary intended usage of OpenCensus Web is to collect
spans from the resource timing waterfall of an initial page load. See the 
[OpenCensus Web readme][oc-web-readme-url] for details.

In the future we would like to support collecting spans for XHRs and other
operations made after the initial page load and then join those back to the
Resrouce Timing API information for more detailed network timings and events.

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
