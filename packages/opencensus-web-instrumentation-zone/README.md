# OpenCensus Web instrumentation zone for user interaction tracing
[![Gitter chat][gitter-image]][gitter-url]

*For overview and usage info see the main [OpenCensus Web readme][oc-web-readme-url].*

This package generates OpenCensus Web model spans based on user interactions 
coming after initial page loads. This uses the library 
[Zone.js][zonejs-url] to generate those spans. For that, 
the package imports the Zone.js library as hard dependency.

The library is in alpha stage and the API is subject to change.

## Overview

This package depends on `@opencensus/web-instrumentation-zone-peer-dep` which contains
all the code related to on-page user interaction tracing. Then, this only exports all
from that package and imports the `Zone.js` library added as hard dependecy.

Instrument your application with this package if your application does not already depends on 
`Zone.js`, this is the case for frameworks like *React*.

See the `@opencensus/web-instrumentation-zone-peer-dep` 
[documentation][instrumentation-zone-peer-dep-url] for more details.

## Usage 

### Custom spans
In addition to automatic user interaction tracing, it is possible to create 
your own spans for the tasks or code involved in a user interaction.
Here is an example for JavaScript

```javascript
import { tracing } from '@opencensus/web-instrumentation-zone';

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
[zonejs-url]: https://github.com/angular/zone.js/
[instrumentation-zone-peer-dep-url]: https://github.com/census-instrumentation/opencensus-web/tree/master/packages/opencensus-web-instrumentation-zone-peer-dep