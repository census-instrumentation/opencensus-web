# OpenCensus Web Initial Load
[![Gitter chat][gitter-image]][gitter-url]

*For overview and usage info see the main [OpenCensus Web readme][oc-web-readme-url].*

This package contains the logic for the initial load page tracing.

The library is in alpha stage and the API is subject to change.

## Overview

This package is currently exporting the trace associated to the initial load trace which
generates a root span for the user navigation experience until the browser `load` event fires.
This root span, will have several child spans corresponding to the loaded resources such as
CSS or JS scripts. These spans are generated via the browser's [Navigation Timing][navigation-timing-url] and 
[Resource Timing][resource-timing-url] APIs. Also, the [Long Tasks][long-tasks-url] browser API is 
used to generate spans named as *long js task* for event loops taking more than 50 ms.

Additionally, the sampling decision for OpenCensus Web is done here and a global
*initial load span context* is stored to be passed around OC Web. This allows other packages to
use the same sampling decision or relate their data to the initial load trace. This is the
case for a `@opencensus/web-instrumentation-zone`.

## Usage

Currently the primary intended usage of OpenCensus Web is to collect
spans from the resource timing waterfall of an initial page load
and trace on-page user interactions with a series of features like automatic tracing 
for *clicks* and *route transitions*, *custom spans*, and browser [Performance API][performance-api] data.
See the [OpenCensus Web readme][oc-web-readme-url] for details.

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
[license-url]: https://github.com/census-instrumentation/opencensus-web/blob/master/packages/opencensus-web-propagation-tracecontext/LICENSE
[opencensus-service-url]: https://github.com/census-instrumentation/opencensus-service
[performance-api]: https://developer.mozilla.org/en-US/docs/Web/API/Performance
[navigation-timing-url]: https://www.w3.org/TR/navigation-timing-2/
[long-tasks-url]: https://w3c.github.io/longtasks/
[resource-timing-url]: https://www.w3.org/TR/resource-timing-2/