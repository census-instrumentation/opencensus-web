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

const webpackConfig = require('./webpack.config');
const path = require('path');

delete webpackConfig.entry;

module.exports = (config) => {
  config.set({
    listenAddress: 'localhost',
    hostname: 'localhost',
    browsers: ['ChromeHeadless'],
    frameworks: ['jasmine'],
    reporters: ['spec', 'coverage-istanbul'],
    files: ['test/index.ts'],
    preprocessors: {'test/index.ts': ['webpack']},
    // Use webpack so that tree-shaking will remove all Node.js dependencies of
    // the `@opencensus/web-types` library, since they are not actually used in this
    // package's compiled JS code. Only the TypeScript interfaces from
    // `@opecensus/core` are used.
    webpack: webpackConfig,
    webpackMiddleware: {noInfo: true},
    coverageIstanbulReporter: {
      reports: ['json', 'text-summary'],
      dir: path.join(__dirname, 'coverage'),
      fixWebpackSourcePaths: true,
    },
  });
};
