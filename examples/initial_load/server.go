// Copyright 2019, OpenCensus Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package main

import (
	"contrib.go.opencensus.io/exporter/ocagent"
	cryptoRand "crypto/rand"
	"encoding/hex"
	"flag"
	"fmt"
	"go.opencensus.io/plugin/ochttp"
	"go.opencensus.io/plugin/ochttp/propagation/tracecontext"
	"go.opencensus.io/trace"
	"html/template"
	"log"
	"math/rand"
	"net/http"
	"time"
)

// Use a local agent by default to help in local development.
var agentEndpoint = flag.String("agent", "http://localhost:55678", "HTTP(S) endpoint of the OpenCensus agent")

// Use local webpack server on port 8080 by default.
var ocwScriptEndpoint = flag.String("ocw_script_prefix", "http://localhost:8080", "HTTP(S) endpoint that serves OpenCensus Web JS script")

var listenAddr = flag.String("listen", "127.0.0.1:8000", "")

// Data rendered to the HTML template
type pageData struct {
	Traceparent       string
	AgentEndpoint     string
	OcwScriptEndpoint string
}

func main() {
	exp, err := ocagent.NewExporter(ocagent.WithInsecure(), ocagent.WithServiceName("hello-server"))
	if err != nil {
		log.Fatalf("Failed to create the agent exporter: %v", err)
	}
	defer exp.Stop()

	trace.RegisterExporter(exp)

	// Always trace for this demo. In a production application, you should
	// configure this to a trace.ProbabilitySampler set at the desired
	// probability.
	trace.ApplyConfig(trace.Config{DefaultSampler: trace.AlwaysSample()})

	serveMux := http.NewServeMux()
	serveMux.HandleFunc("/", handleRequest)
	fs := http.FileServer(http.Dir("static"))
	serveMux.Handle("/static/", http.StripPrefix("/static/", fs))

	var handler http.Handler = serveMux
	handler = &ochttp.Handler{
		Handler:     serveMux,
		Propagation: &tracecontext.HTTPFormat{},
	}
	// Note that the `ensureTraceHeader` middleware comes after the
	// `ochttp.Handler` middleware so that it is executed first. That way it the
	// traceparent header will already be set when the ochttp.Handler middleware
	// runs.
	handler = ensureTraceHeader(handler)

	fmt.Printf("OC Web initial load example server listening on %v\n", *listenAddr)
	log.Fatal(http.ListenAndServe(*listenAddr, handler))
}

// Adds a random traceparent header if none is specified. This is needed
// because the browser does not sent a trace header for the initial page
// load. The traceparent header is written to the HTML so that the browser span
// can become the parent of the initial load server span.
func ensureTraceHeader(next http.Handler) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		traceparent := fmt.Sprintf("00-%s-%s-01", randHex(32), randHex(16))
		r.Header.Add("traceparent", traceparent)
		next.ServeHTTP(w, r)
	}
}

func handleRequest(w http.ResponseWriter, r *http.Request) {
	// Parse template.
	_, parseSpan := trace.StartSpan(r.Context(), "Parse template")
	tmpl := template.Must(template.ParseFiles("index.html"))
	parseSpan.End()

	// Sleep for [1,100] milliseconds to fake work.
	_, delaySpan := trace.StartSpan(r.Context(), "Random delay")
	time.Sleep(time.Duration(rand.Intn(100)+1) * time.Millisecond)
	delaySpan.End()

	// Render template.
	_, renderSpan := trace.StartSpan(r.Context(), "Render template")
	data := pageData{
		Traceparent:       r.Header.Get("traceparent"),
		AgentEndpoint:     *agentEndpoint,
		OcwScriptEndpoint: *ocwScriptEndpoint,
	}
	tmpl.Execute(w, data)
	renderSpan.End()
}

// randHex returns a random hexadecimal encoded string of given number of bytes.
func randHex(numBytes int) string {
	b := make([]byte, numBytes/2)
	if _, err := cryptoRand.Read(b); err != nil {
		panic(err)
	}
	return hex.EncodeToString(b)[:numBytes]
}
