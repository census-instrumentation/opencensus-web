# OpenCensus Web instrumentation zone for user interaction tracing
[![Gitter chat][gitter-image]][gitter-url]

*For overview and usage info see the main [OpenCensus Web readme][oc-web-readme-url].*

This package generates OpenCensus Web model spans based on user interactions 
coming after initial page loads. This uses the library 
[Zone.js](https://github.com/angular/zone.js/) to generate those spans.

This package adds `Zone.js` as a peer dependency as the application 
might already be dependet on it. This is the case, for example, with 
application on `Angular` as this already imports it. 

The library is in alpha stage and the API is subject to change.

## Usage

#### Custom spans
In addition to automatic user interaction tracing, it is possible to create 
your own spans for the tasks or code involved in a user interaction.
Here is an example for JavaScript

```javascript
import { tracing } from '@opencensus/web-core';

function handleClick() {
  // Start child span which will be child of the current root span on the current interaction.
  // To make sure the span is attached to the root span, add this in code that the button is running.
  const childSpan = tracing.tracer.startChildSpan({
    name: 'name of your child span'
  });
  // Do some operation...
  // Finish the child span at the end of it's operation
  childSpan.end();
}

// Create a fake button to point out the custom span is created in the click handler.
const button = document.createElement('button');
button.onclick = handleClick;
```
Check the [user interaction client example][client-example-url] which instruments the package and 
create some custom spans.

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
[client-example-url]: https://github.com/census-instrumentation/opencensus-web/tree/master/examples/user_interaction/client