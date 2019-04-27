#!/bin/bash

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

# Fail the script if any command fails
set -e

PACKAGE_SUFFIX="$1"
NPM_TOKEN="$2"

# Print each line of the script but don't expand variables.
set -v

rm -f ~/.npmrc

# Publish to NPM via the Google wombat bot that manages auth tokens, so each
# token has authority to publish to just a single package.
echo "//wombat-dressing-room.appspot.com/:_authToken=${NPM_TOKEN}" > ~/.npmrc

cd "packages/opencensus-web-$PACKAGE_SUFFIX"

npm publish --registry https://wombat-dressing-room.appspot.com
