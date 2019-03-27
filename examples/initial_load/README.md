# OpenCensus Web example server for initial load spans

This example server renders a simple hello page and writes both the server-side
and client side spans for the initial page load to the [OpenCensus agent](https://github.com/census-instrumentation/opencensus-service).

## Running locally

### Step 1: Install and run the OpenCensus agent

To run this example in local development mode, you will need to run the [OpenCensus
agent](https://github.com/census-instrumentation/opencensus-service).

First set your `GOPATH` environment variable and ten install the agent by
running:

```bash
go get -d github.com/census-instrumentation/opencensus-service
```

Then create a `config.yaml` file following the
[Configuration](https://github.com/census-instrumentation/opencensus-service#config) instructions for the agent. You will need to have the `opencensus` receiver set up on the default port of `55678`, and you will need at least one exporter so you can see the traces that are generated. For example, your config file could look like this:

```yaml
receivers:
  opencensus:
    address: "127.0.0.1:55678"

exporters:
  # Pick and configure an exporter e.g. stackdriver, zipkin, aws-xray, honeycomb
```
Then in the same folder as your `config.yaml` run the agent with this command:

```bash
go run github.com/census-instrumentation/opencensus-service/cmd/ocagent
```

### Step 2: Run the local webpack server

Then within your `opencensus-web` folder run the local webpack server for the
`opencensus-all` package to serve the OpenCensus web scripts:

```bash
cd packages/opencensus-web-all
npm run start:webpack-server
```

That will start the webpack development server on `localhost:8080`.

### Step 3: Run this example server

Now you can run this example server with the following commands from within your
`opencensus-web` folder:

```bash
cd examples/initial_load
go run server.go
```

Now visit http://localhost:8000/index.html in your browser to see the hello
world page render. If you look in the browser developer tools network tab, you
should see an XHR that writes trace spans to the OpenCensus agent. Then go to
the trace viewer for the exporter you set up and view the trace of your initial
page load. It will be named `Nav./index.html` (or just `Nav./` if you left off
the actual `index.html` part when you visited the URL).

## Deploying to Kubernetes

TODO(draffensperger): develop example Kubernetes deployment instructions.
