# OpenCensus Web example server for user interaction tracing

This example server renders a simple hello page and writes both the server-side
and client side spans for the initial page load and user interactions to the 
[OpenCensus agent][opencensus-agent].

The main purpose of this example is to show the user interaction tracing.
For that, a `React JS` client is instrumented with the npm `@opencensus/web-instrumentation-zone` package to 
start tracing the user interactions. Additionally, a `Node JS` server is instrumented with 
`@opencensus/nodejs` library to send spans by default to [Zipkin][zipkin]

The app has two buttons with the same click handler but one button has the `data-ocweb-id` 
attribute to show this naming aproach, and the other button has an `id` to show the CSS 
selector naming approach. When one button is clicked, a new interaction is started, it first tracks 
a `Promise` which will run a `setTimeout` of 1000 ms, once this is done, an HTTP 
request is sent to the server which sleeps for 2 seconds and then sends the response. 
Once the request has finished, another HTTP request is done to do some calculations in the server 
side, then the client will calculate PI to show a long span.
After all of those tasks, the interaction finishes and is sent to the OC Agent.

Additionally, the client provides some route transitions to show the *Navigation* naming approach.

## Running locally

### Step 1: Install and run the OpenCensus agent

To run this example in local development mode, you will need to run the [OpenCensus agent][opencensus-agent].

First set your `GOPATH` environment variable and then install the agent by running:

```bash
go get -d github.com/census-instrumentation/opencensus-service
```

Then create a `config.yaml` file following the
[Configuration][opencensus-servie-config] instructions for the agent. You will need to have the 
`opencensus` receiver set up on the default port of `55678`, and you will need at least one exporter 
so you can see the traces that are generated. For example, your config file could look like this:

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
GO111MODULE=on go run github.com/census-instrumentation/opencensus-service/cmd/ocagent
```

### Step 2: Run the client (React application)

Then within the `client` folder install all dependencies and run locally the application.

```bash
cd client/
npm install
npm start
```

That will start the react application on `localhost:3000`.

### Step 3: Run the server

Now you can run the example server with the following commands from within your
`opencensus-web` folder:

```bash
cd server/
node server.js
```

Now visit http://localhost:3000/ in your browser to see the hello
world page render. If you click on the button or navigate to another page
in the browser developer tools network tab, you should see an XHR that writes 
trace spans to the OpenCensus agent. 

Then go to the trace viewer for the exporter you set up and view the trace of your initial
page load plus the different user interaction traces. Notice they will be named as 
*Trace user interaction*, *button#trace_interaction click* or *Navigation /second_page*
for this example. Then, in every trace you will see several spans associated to the interaction.


[opencensus-agent]: (https://github.com/census-instrumentation/opencensus-service)
[zipkin]: (https://opencensus.io/codelabs/zipkin/)
[opencensus-servie-config]: (https://github.com/census-instrumentation/opencensus-service#config)