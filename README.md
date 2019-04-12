# OpenCensus - A stats collection and distributed tracing framework
[![Gitter chat][gitter-image]][gitter-url]
[![circleci][circleci-image]][circleci-url]
[![codecov][codecov-image]][codecov-url]
[![Known Vulnerabilities][snyk-image]][snyk-url]
[![Apache License][license-image]][license-url]

OpenCensus Web is an implementation of OpenCensus, a toolkit for collecting
application performance and behavior monitoring data. This library currently
generates traces for the initial page load of a site in the browser. It supports
sending the trace sampling decision and trace ID from the web server to the
browser client to enable latency debuging across the stack.

The library is in alpha stage and the API is subject to change.

Please join [gitter][gitter-url] for help or feedback on this project.

## Usage

**NOTE**: *These usage instructions will likely change as the project matures.
The goal is to make this easier to use over time!*

See the [examples/initial_load][examples-initial-load-url] folder for a full
example of how to use OpenCensus Web in an application. Below are
the steps that are currently needed to use it.

### 1. Deploy the OpenCensus agent to collect traces

The OpenCensus Web library currently only exports traces via the
[OpenCensus Agent][oc-agent-url], which can then export them to a variety of
tracing backends such as Zipkin, Jaeger, Stackdriver, DataDog, Honeycomb,
and AWS X-Ray. See this [example's README][initial-load-example-url]
for steps to run the agent locally or in the cloud.

When you run the agent in the cloud you will need to expose it to your
application via the internet. You may also to proxy the agent behind the
authentication or CSRF protection layer of your application to to only allow
traces to be written by authenticated end users.

### 2. Use the OpenCensus Web library code in your application

To include the OpenCensus Web library code, clone this repo and the build the JS
bundles:
```bash
git clone https://github.com/census-instrumentation/opencensus-web
cd packages/opencensus-web-all
npm run build:prod
```

Then you copy the script `./dist/initial-load-all.js` as a static asset
of your application, and include it in a `<script>` tag, e.g. 
`<script src="/static/initial-load-all.js"></script>` assuming you were serving
it from the `/static` folder of your site.

Once the OpenCensus Web packages are released to NPM, you will also be able to
include them in your JavaScript build pipeline as an imported dependency.

In order to indicate the endpoint of the OpenCensus Agent so that traces can be
written, you will need to include a snippet of JavaScript that sets the
`ocAgent` global variable, for instance:

```html
<script>ocAgent = 'https://example.com/my-opencensus-agent-endpoint'</script>
```

### 3. Optional: Send a trace parent and sampling decision from your server

Currently, the OpenCensus Web will sample all requests by default. This is
useful for experimentation with the library but is not appropriate for a real
application.

OpenCensus Web also supports connecting the server side spand for the initial
HTML load with the client side span for the load from the browser's timing API.

Because the browser does not send a trace context header for the initial page
navigation, the server needs to fake a trace context header in a middleware and
then send that trace context header back to the client as a global `traceparent`
variable. The `traceparent` variable should be in the
[trace context W3C draft format][trace-context-url].

To see a full example of how the middleware to generate a trace context header
and send it back to the client, see the
[server.go][initial-load-example-server-go] file and the 
[index.html][initial-load-example-index-html] template in the
[examples/initial_load][initial-load-example-url] folder.

## Packages

The OpenCensus web library is composed of the following packages:

- **[@opencensus/web-types][package-web-types]**. This has automatically copied types from the [@opencensus/core][package-core] package of [OpenCensus Node][opencensus-node]. The types are copied because the `@opencensus/core` package has Node-specific dependencies that make it hard to depend on from browser-specific code.
- **[@opencensus/web-core][package-web-core]**. This has the core span and tracer implementation for web browsers. Currently the tracer assumes there is only one current root span for a given browser tab.
- **[@opencensus/web-exporter-ocagent][package-web-exporter-ocagent]**. This handles exporting spans to the [OpenCensus Agent][opencensus-service-url]
- **[@opencensus/web-instrumentation-perf][package-web-instrumentation-perf]**. This is code to convert the initial load resource waterfall timings from the browser [Navigation Timing API][navigation-timing-url] and [Resource Timing API][resource-timing-url] into  the spans for a trace of the overall initial load for a page.
- **[@opencensus/web-propagation-tracecontext][package-web-propagation-tracecontext]**. This provides utilities to serialize and deserialize a `traceparent` trace context header in the [W3C draft trace context format][trace-context-url]
- **[@opencensus/web-all][package-web-all]**. This depends on all the other OpenCensus Web libraries and provides top-level functions for instrumenting the initial page load and exporting its spans to the OpenCensus Agent. It also provides WebPack builds for JS bundles that can be used in `<script>` tags.

## Useful links
- For more information on OpenCensus, visit: <https://opencensus.io/>
- For help or feedback on this project, join us on [gitter][gitter-url]

## Versioning

This library follows [Semantic Versioning][semver-url].

**GA**: Libraries defined at a GA quality level are stable, and will not introduce
backwards-incompatible changes in any minor or patch releases. We will address issues and requests
with the highest priority. If we were to make a backwards-incompatible changes on an API, we will
first mark the existing API as deprecated and keep it for 18 months before removing it.

**Beta**: Libraries defined at a Beta quality level are expected to be mostly stable and we're
working towards their release candidate. We will address issues and requests with a higher priority.
There may be backwards incompatible changes in a minor version release, though not in a patch
release. If an element is part of an API that is only meant to be used by exporters or other
opencensus libraries, then there is no deprecation period. Otherwise, we will deprecate it for 18
months before removing it, if possible.

**Alpha**: Libraries defined at a Alpha quality level can be unstable and could cause crashes or data loss. Alpha software may not contain all of the features that are planned for the final version. The API is subject to change.

## License

Apache 2.0 - See [LICENSE][license-url] for more information.

[circleci-image]: https://circleci.com/gh/census-instrumentation/opencensus-web.svg?style=shield
[circleci-url]: https://circleci.com/gh/census-instrumentation/opencensus-web
[codecov-image]: https://codecov.io/gh/census-instrumentation/opencensus-web/branch/master/graph/badge.svg
[codecov-url]: https://codecov.io/gh/census-instrumentation/opencensus-web
[examples-initial-load-url]: https://github.com/census-instrumentation/opencensus-web/tree/master/examples/initial_load
[gitter-image]: https://badges.gitter.im/census-instrumentation/lobby.svg
[gitter-url]: https://gitter.im/census-instrumentation/lobby?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge
[initial-load-example-index-html]: https://github.com/census-instrumentation/opencensus-web/blob/master/examples/initial_load/index.html
[initial-load-example-server-go]: https://github.com/census-instrumentation/opencensus-web/blob/master/examples/initial_load/server.go
[initial-load-example-url]: https://github.com/census-instrumentation/opencensus-web/tree/master/examples/initial_load
[license-image]: https://img.shields.io/badge/license-Apache_2.0-green.svg?style=flat
[license-url]: https://github.com/census-instrumentation/opencensus-web/blob/master/LICENSE
[navigation-timing-url]: https://www.w3.org/TR/navigation-timing-2/
[oc-agent-url]: https://github.com/census-instrumentation/opencensus-service
[opencensus-node-url]: https://github.com/census-instrumentation/opencensus-node
[opencensus-service-url]: https://github.com/census-instrumentation/opencensus-service
[package-core]: https://github.com/census-instrumentation/opencensus-node/tree/master/packages/opencensus-core
[package-web-all]: https://github.com/census-instrumentation/opencensus-web/tree/master/packages/opencensus-web-all
[package-web-core]: https://github.com/census-instrumentation/opencensus-web/tree/master/packages/opencensus-web-core
[package-web-exporter-ocagent]: https://github.com/census-instrumentation/opencensus-web/tree/master/packages/opencensus-web-exporter-ocagent
[package-web-instrumentation-perf]: https://github.com/census-instrumentation/opencensus-web/tree/master/packages/opencensus-web-instrumentation-perf
[package-web-propagation-tracecontext]: https://github.com/census-instrumentation/opencensus-web/tree/master/packages/opencensus-web-propagation-tracecontext
[package-web-types]: https://github.com/census-instrumentation/opencensus-web/tree/master/packages/opencensus-web-types
[resource-timing-url]: https://www.w3.org/TR/resource-timing-2/
[semver-url]: http://semver.org/
[snyk-image]: https://snyk.io/test/github/census-instrumentation/opencensus-web/badge.svg?style=flat
[snyk-url]: https://snyk.io/test/github/census-instrumentation/opencensus-web
[trace-context-url]: https://www.w3.org/TR/trace-context/
