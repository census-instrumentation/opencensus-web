# Copyright 2019, OpenCensus Authors
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http:#www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# First build the server binary
FROM golang:alpine AS build
RUN apk update && apk add --no-cache git && apk add --no-cache ca-certificates
WORKDIR /root
ADD go.mod .
ADD go.sum .
ADD server.go .
RUN GO111MODULE=on go get -d -v
RUN GO111MODULE=on CGO_ENABLED=0 go build -o example_server

# Then put the server binary and needed files into an empty container
FROM scratch
COPY index.html /
COPY ./static/*.js /static/
COPY --from=build ./root/example_server /
ENTRYPOINT ["/example_server"]
EXPOSE 8000
