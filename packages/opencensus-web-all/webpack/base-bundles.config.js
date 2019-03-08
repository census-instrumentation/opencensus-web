/**
 * Copyright 2019, OpenCensus Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const path = require('path');

module.exports = {
  entry: {
    'export-initial-load': './src/entrypoints/export-initial-load.ts',
    'instrument-initial-load': './src/entrypoints/instrument-initial-load.ts',
    'initial-load-all': './src/entrypoints/initial-load-all.ts',
  },
  resolve: {extensions: ['.ts', '.js']},
  devtool: 'source-map',
  module: {rules: [{test: /\.ts$/, use: 'ts-loader'}]},
  stats: {
    // Examine all modules
    maxModules: Infinity,
    // Display bailout reasons
    optimizationBailout: true,
  },
};
