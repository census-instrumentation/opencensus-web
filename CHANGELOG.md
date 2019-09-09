# Changelog

All notable changes to this project will be documented in this file.

## Unreleased

- Support for B3 propagation with new `@opencensus/web-propagation-b3` package
  and the ability to pass it in via `startTracing({ propagation: Propagation })`.
  Thanks @edvinasbartkus!

## 0.0.6 - 2019-08-26

- Fixed TypeError in Safari, thanks @backjo (#167)

## 0.0.5 - 2019-08-09

- Fixes to interaction tracker.
- Service name can be specified via window variable, thanks @Blightwidow
- Fixes to automated NPM publish script.

## 0.0.4 - 2019-08-06

- Rename `@opencensus/web-all` to `@opencensus/web-scripts` so now this package 
    is only in charge of bundling OC Web to allow importing it as <script> tag.

- To use OC Web as an npm dependency, there are several options: `@opencensus/web-initial-load`
    to instrument with only the initial page load module, `@opencensus/web-instrumentation-zone`
    to instrument it with all the OC Web functionality plus the `Zone.js` library and 
    `@opencensus/web-instrumentation-zone-peer-dep` also exports all the functionality but `Zone.js`
    is a peer dependency.

- Implementation of *User interaction tracing* monkey-patching the `Zone.js` library. This includes
    some features like: automatic tracing for click events and route transitions, custom spans, 
    automatic spans for HTTP requests and Browser performance data, relate user interaction traces
    back the the initial page load trace and sampling.

## 0.0.3 - 2019-06-08

- Support custom end time for span (#95), thanks @skjindal93
- Upgraded types to match `@opencensus/core` package version `0.0.13`.
- Package upgrades
- Add support for object(`SpanOptions`) as an argument for `startChildSpan` function, similar to `startRootSpan`.
- Please note that there is an API breaking change in methods `addMessageEvent()`. The field `id` is now number instead of string.

## 0.0.2 - 2019-04-29

Fix: add JS bundles and source maps to the NPM files for @opencensus/web-all 
(#66), which were incorrectly not included before. This enables linking the JS
bundles in `<script>` tags via the unpkg.com or jsdelivr.com CDNs for NPM files.

## 0.0.1 - 2019-04-26

- TypeScript interfaces and enums extracted from the `@opencensus/core`
    package of [opencensus-node][opencensus-node-url]
- Initial `Tracer` and `Span` implementations. The tracer only supports a single
    root span at a time within a browser tab.
- Exporter to write traces to the OpenCensus Agent via its [HTTP/JSON feature][oc-agent-http-url].
- Instrumentation to generate trace spans for the resource timing waterfall of
    an initial page load.
- Option to link the initial HTML load client span with its server-side span by
  having the client write a `traceparent` global variable in
  [trace context W3C draft format][trace-context-url].
- WebPack build scripts to generate JS bundles to enable adding instrumentation
  of the initial page load spans and exporting them to the OpenCensus agent.

[oc-agent-http-url]: https://github.com/census-instrumentation/opencensus-service/tree/master/receiver#writing-with-httpjson
[opencensus-node-url]: http://github.com/census-instrumentation/opencensus-node
[trace-context-url]: https://www.w3.org/TR/trace-context/
