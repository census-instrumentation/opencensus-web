# OpenCensus Web Core (Trace Model)
[![Gitter chat][gitter-image]][gitter-url]

*For overview and usage info see the main [OpenCensus Web readme][oc-web-readme-url].*

This package contains the core trace model used by OpenCensus Web. This
trace model is based on the same TypeScript interfaces that
[OpenCensus Node](https://github.com/census-instrumentation/opencensus-node)
uses.

The library is in alpha stage and the API is subject to change.

## Usage

Currently the primary intended usage of OpenCensus Web is to collect
spans from the resource timing waterfall of an initial page load
and trace on-page user interactions with a series of features like automatic tracing 
for *clicks* and *route transitions*, *custom spans*, and browser [Performance API][performance-api] data.
See the [OpenCensus Web readme][oc-web-readme-url] for details.

In the future we would like to make it easy to generate custom spans that will
be conveniently exported to the [OpenCensus Agent][opencensus-service-url]. This
package has the API that will support generation of custom spans. Although it's
not fully wired up and supported yet, you're welcome to poke around the source
code and try to use it!

## Useful links
- For more information on OpenCensus, visit: <https://opencensus.io/>
- For more about OpenCensus Web: <https://github.com/census-instrumentation/opencensus-web>
- For help or feedback on this project, join us on [gitter][gitter-url]

## License

Apache 2.0 - See [LICENSE][license-url] for more information.

[gitter-image]: https://badges.gitter.im/census-instrumentation/lobby.svg
[gitter-url]: https://gitter.im/census-instrumentation/lobby
[oc-web-readme-url]: https://github.com/census-instrumentation/opencensus-web/blob/master/README.md
[license-url]: https://github.com/census-instrumentation/opencensus-web/blob/master/packages/opencensus-web-core/LICENSE
[opencensus-service-url]: https://github.com/census-instrumentation/opencensus-service
[performance-api]: (https://developer.mozilla.org/en-US/docs/Web/API/Performance)