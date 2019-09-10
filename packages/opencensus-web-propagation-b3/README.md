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

It gets passed as an option to the `startTracing` function as follows:

```js
// Use @opencensus/web-instrumentation-zone-peer-dep instead in case your app
// already uses `Zone.js`.
import { startTracing } from '@opencensus/web-instrumentation-zone';
import { B3Format } from '@opencensus/web-propagation-b3';

window.ocAgent = 'https://example.com/my-opencensus-agent-endpoint';
window.ocSampleRate = 1.0; // Sample at 100% for test only. Default is 1/10000.
// Send the trace header to all hosts.
window.ocTraceHeaderHostRegex = /.*/;

// This methods starts the tracing and exports the initial page load trace.
// As the tracing has started, the coming user interactions ares also traced.
startTracing({ propagation: new B3Format() });
```

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
