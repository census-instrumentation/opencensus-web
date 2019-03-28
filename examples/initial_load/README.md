# OpenCensus Web example server for initial load spans

This example server renders a simple hello page and writes both the server-side
and client side spans for the initial page load to the [OpenCensus agent](https://github.com/census-instrumentation/opencensus-service).

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

## Deploying to GKE (Kubernetes on Google Cloud Platform)

### 1. Install needed tools

Install [gcloud](https://cloud.google.com/sdk/install).
Then run `gcloud components install kubectl` to install `kubectl`.

### 2. Set up GKE cluster and configure container registry

To create a cluster with the following commands:

```bash
gcloud services enable container.googleapis.com
gcloud container clusters create opencensus-web-demo --enable-autoupgrade --num-nodes=1 --zone=us-central1-a
```
You also need to enable Google Container Registry (GCR) on your GCP project and configure the docker CLI to authenticate to GCR:

```bash
gcloud services enable containerregistry.googleapis.com
gcloud auth configure-docker -q
```

### 3. Deploy the OpenCensus Agent

To deploy the agent, run the following commands:

```bash
# Get the project you are using with gcloud
PROJECT_ID="$(gcloud config list --format 'value(core.project)')"

# Substitute the project ID in the k8s config and deploy it
cat ./kubernetes/oc-agent-cors.template.yaml | \
  sed "s/{{PROJECT-ID}}/$PROJECT_ID/" | \
  kubectl apply -f -
```
Note that this uses the [omnition/opencensus-agent](./kubernetes/agent-cors.yaml)
container from the Docker Hub. You can also build your own container by
following the
[OpenCensus Agent](https://github.com/census-instrumentation/opencensus-service#opencensus-agent)
docs.

### 5. Build the demo application container

First build the OpenCensus Web scripts that will be deployed with the
application:

```bash
npm run build:prod --prefix=../../packages/opencensus-web-all
cp ../../packages/opencensus-web-all/dist/*.js ./static
```
Then build the server container and push it to GCR:

```bash
PROJECT_ID="$(gcloud config list --format 'value(core.project)')"
docker build . -t gcr.io/$PROJECT_ID/oc-web-initial-load:latest
gcloud docker -- push gcr.io/$PROJECT_ID/oc-web-initial-load:latest
```

### 4. Deploy the demo application

Run the command `kubectl get svc oc-agent-service` to check if the 
`EXTERNAL-IP` column has been filled in. If it is still pending, then wait a bit
and run it again until it's available.

Once you the agent has an external IP, you can deploy the example service that
uses it by running the following commands:

```bash
PROJECT_ID="$(gcloud config list --format 'value(core.project)')"
AGENT_IP="$(kubectl get svc oc-agent-service \
    -o=custom-columns="IP ADDRESS:.status.loadBalancer.ingress[*].ip" | \
    tail -n 1)"
cat ./kubernetes/initial-load-demo.template.yaml | \
  sed "s/{{PROJECT-ID}}/$PROJECT_ID/; s/{{AGENT-IP}}/$AGENT_IP/" | \
  kubectl apply -f -
```

Then run `kubectl get svc oc-web-initial-load-service` to see the external IP
address for the demo app, which you can then visit in your browser.

You can then view traces in the [Stackdriver Trace](https://console.cloud.google.com/traces/traces) console in GCP. The traces will be named `Nav./`.
