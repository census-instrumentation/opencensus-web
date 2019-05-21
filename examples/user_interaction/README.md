# OpenCensus Web example server for user interaction tracing

This example server renders a simple hello page and writes both the server-side
and client side spans for the initial page load to the [OpenCensus agent](https://github.com/census-instrumentation/opencensus-service).

Also, add a button in order to test user interactions, this button triggers to network requests to the provided node server when it is clicked.
These requests, Sleep the server for a while and calculate prime numbers until 100000. After this, the frontend calculates PI.
The idea of these calls is to trace the click on the button and see calculations in server and client side.

## Running locally

### Step 1: Install and run the OpenCensus agent

To run this example in local development mode, you will need to run the [OpenCensus
agent](https://github.com/census-instrumentation/opencensus-service).

First set your `GOPATH` environment variable and then install the agent by
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
    cors_allowed_origins:
      - http://localhost:*
exporters:
  # Pick and configure an exporter e.g. stackdriver, zipkin, aws-xray, honeycomb
```
Then in the same folder as your `config.yaml` run the agent with this command:

```bash
go run github.com/census-instrumentation/opencensus-service/cmd/ocagent
```

### Step 2: Run the client (React application)

Then within your the `client` folder install all dependencies and run locally the application.

```bash
cd client/
npm install
npm start
```

That will start the react application on `localhost:3000`.

### Step 3: Run this example server

Now you can run this example server with the following commands from within your
`opencensus-web` folder:

```bash
cd examples/user_interaction/server/
node server.js
```

Now visit http://localhost:3000/ in your browser to see the hello
world page render. If you look in the browser developer tools network tab, you
should see an XHR that writes trace spans to the OpenCensus agent. Then go to
the trace viewer for the exporter you set up and view the trace of your initial
page load. It will be named `Nav./index.html` (or just `Nav./` if you left off
the actual `index.html` part when you visited the URL).
