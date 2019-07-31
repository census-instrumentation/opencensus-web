# OpenCensus Web All (JS bundles)
[![Gitter chat][gitter-image]][gitter-url]

*For overview and usage info see the main [OpenCensus Web readme][oc-web-readme-url].*

This package combines all of the main functionality of the OpenCensus Web
packages into a variety of distributions for easy inclusion into web
applications via a `<script>` tag.

The library is in alpha stage and the API is subject to change.

## Build commands

To generate production minified JS bundles run `npm run build:prod`. For
non-minified bundles use `npm run build:dev`.

To serve the bundles from a local webpack server run `npm run
start:webpack-server`.

## Generated scripts

These are the generated bundles.

If you don't mind loading a single larger bundle on the initial page load, use:

* **`./dist/initial-load-all.js`** - This script combines the functionality of
    the `instrument-initial-load.js` and `export-initial-load.js` below. That
    is, it records spans based on the [resource timing API][resource-timing-url]
    for the initial page load and exports it to the OpenCensus Agent based on
    configured global variables. See the main 
    [OpenCensus Web readme][oc-web-readme-url] for details.

If you would like to minimize the amount of JS loaded initially, you can use
these two bundles to do instrumentation first and then an export more lazily:

* **`./dist/instrument-initial-load.js`** - This is a small script that sets up the
    instrumentation configuration for getting resource timing span data for the
    initial page load. Specifically, it starts recording
    [Long Tasks][long-tasks-url] and increases the
    [resource timing buffer size][resource-timing-buffer-url]. This code should
    be loaded as part of the initial page load
* **`./dist/export-initial-load.js`** - This script exports the resouce timing
    and long task information for the initial load to the agent. It can be
    retrieved after the initial page load has fully completed so it being
    downloaded and parsed doesn't need to compete with resources for the main
    page load.

## Useful links
- For more information on OpenCensus, visit: <https://opencensus.io/>
- For more about OpenCensus Web: <https://github.com/census-instrumentation/opencensus-web>
- For help or feedback on this project, join us on [gitter][gitter-url]

## License

Apache 2.0 - See [LICENSE][license-url] for more information.

[gitter-image]: https://badges.gitter.im/census-instrumentation/lobby.svg
[gitter-url]: https://gitter.im/census-instrumentation/lobby
[oc-web-readme-url]: https://github.com/census-instrumentation/opencensus-web/blob/master/README.md
[license-url]: https://github.com/census-instrumentation/opencensus-web/blob/master/packages/opencensus-web-scripts/LICENSE
[long-tasks-url]: https://w3c.github.io/longtasks/
[resource-timing-buffer-url]: https://www.w3.org/TR/resource-timing-2/#dom-performance-setresourcetimingbuffersize
[resource-timing-url]: https://www.w3.org/TR/resource-timing-2/
