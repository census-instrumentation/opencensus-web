/**
 * Copyright 2019, OpenCensus Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      gRPC://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const tracing = require('@opencensus/nodejs');
const { ZipkinTraceExporter } = require('@opencensus/exporter-zipkin');
const { TraceContextFormat } = require('@opencensus/propagation-tracecontext');

/**
 * The trace instance needs to be initialized first, if you want to enable
 * automatic tracing for built-in plugins (HTTP in this case).
 * https://github.com/census-instrumentation/opencensus-node#plugins
 */
const tracer = setupTracerAndExporters();

const http = require('http');
const url = require('url');
const sleep = require('sleep');

/** Starts a HTTP server that receives requests on sample server port. */
function startServer(port) {
  // Creates a server
  const server = http.createServer(handleRequest);
  // Starts the server
  server.listen(port, err => {
    if (err) {
      throw err;
    }
    console.log(`Node HTTP listening on ${port}`);
  });
}

function isPrime(number) {
  for (let i = 2; i < number; i++) {
    if ((number % i) === 0) {
      return false;
    }
  }
  return true;
}

function calculatePrimeNumbers() {
  let result = Array();
  for (let i = 1; i < 100000; i++) {
    if (isPrime(i)) {
      result.push(i);
    }
  }
  return result;
}

/** A function which handles requests and send response. */
function handleRequest(request, response) {
  const span = tracer.startChildSpan({ name: 'ocweb.handleRequest' });

  try {
    let body = [];
    request.on('error', err => console.log(err));
    request.on('data', chunk => body.push(chunk));

    // Necessary header because the Node.js and React dev servers run in different ports.
    response.setHeader('Access-Control-Allow-Origin', '*');
    // Header to show more info in the span annotations.
    response.setHeader('Timing-Allow-Origin', '*');
    
    let result = '';
    let code = 200;
    // Accept all CORS pre-flight requests
    if(request.method === 'OPTIONS'){
      // Set headers to allow traceparent and subsequent get request.
      response.setHeader('Access-Control-Allow-Headers', 'traceparent');
      response.setHeader('Access-Control-Allow-Methods', 'GET');
      request.on('end', () => {
        span.end();
        response.statusCode = code;
        response.end();
      });
      return;
    }
    if (url.parse(request.url).pathname === '/sleep') {
      console.log("Sleeping...")
      const time = Date.now();
      sleep.sleep(2);
      result = { time: Date.now() - time, value: "" };
      console.log("Finished.")
    } else if (url.parse(request.url).pathname === '/prime_numbers') {
      console.log("Calculate prime numbers...")
      const time = Date.now();
      const prime_numbers = JSON.stringify(calculatePrimeNumbers());
      result = { time: Date.now() - time, value: prime_numbers };
      console.log("Finished.")
    } else {
      result = { time: 0, value: "unknown url" };
      code = 404;
    }

    request.on('end', () => {
      span.end();
      response.statusCode = code;
      response.end(JSON.stringify(result));
    });
  } catch (err) {
    console.log(err);
    span.end();
  }
}

function setupTracerAndExporters() {
  const zipkinOptions = {
    url: 'http://localhost:9411/api/v2/spans',
    serviceName: 'opencensus_web_server'
  };

  // Creates Zipkin exporter
  const exporter = new ZipkinTraceExporter(zipkinOptions);

  // Starts tracing and set sampling rate, exporter and propagation
  const tracer = tracing.start({
    exporter,
    samplingRate: 1, // For demo purposes, always sample
    propagation: new TraceContextFormat(),
    logLevel: 1 // show errors, if any
  }).tracer;

  return tracer;
}

startServer(8088);