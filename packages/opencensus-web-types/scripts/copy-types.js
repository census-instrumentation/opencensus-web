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

/**
 * @fileoverview This script copies (and lightly patches) type definitions from
 * the @opencensus/core package. This allows sharing types with @opencensus/core
 * without directly depending on it as an NPM package, which is tricky because
 * @opencensus/core pulls in various Node-specific dependencies.
 */

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const process = require('process');
const util = require('util');

const exec = util.promisify(require('child_process').exec);
const exists = util.promisify(fs.exists);
const mkdtemp = util.promisify(fs.mkdtemp);
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

/** List of files in the @opencensus/core `src` folder to copy over. */
const FILES_TO_COPY = [
  'common/types.ts',
  'exporters/types.ts',
  'metrics/export/types.ts',
  'stats/types.ts',
  'tags/tag-map.ts',
  'tags/types.ts',
  'tags/validation.ts',
  'trace/config/types.ts',
  'trace/instrumentation/types.ts',
  'trace/model/types.ts',
  'trace/propagation/types.ts',
  'trace/sampler/types.ts',
  'trace/types.ts',
];

const OPENCENSUS_NODE_URL =
    'http://github.com/census-instrumentation/opencensus-node';

copyFiles().then(() => {}, (err) => {
  console.error(err);
  process.exit(1);
});

async function copyFiles() {
  if (process.argv.length < 3) {
    throw new Error(
        'Must specify git tag of @opencensus/core copy types from.');
  }
  const openCensusNodeTag = process.argv[2];

  console.log('Copying types from @opencensus/node package ...');

  // Clone and checkout the @opencensus/core repo in a temp directory.
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'opencensus-core-'));
  console.log(`Cloning to temp directory: ${tempDir}`);
  await logAndExec(`git clone ${OPENCENSUS_NODE_URL}`, {cwd: tempDir});
  const srcDir =
      path.join(tempDir, 'opencensus-node/packages/opencensus-core/src');
  await logAndExec(`git checkout ${openCensusNodeTag}`, {cwd: srcDir});

  console.log('Patching and copying type files ...');
  const destDir = path.join(__dirname, '../src');

  for (const srcFile of FILES_TO_COPY) {
    console.log(`Processing ${srcFile} ...`);
    const srcPath = path.join(srcDir, srcFile);
    const destPath = path.join(destDir, srcFile);

    if (!(await exists(srcPath))) {
      throw new Error(`Source file ${destPath} does not exist!`)
    }

    const contents = await readFile(srcPath, {encoding: 'utf8'});
    const patchedContents = getPatchedContents(srcFile, contents);
    await exec(`mkdir -p ${path.dirname(destPath)}`);
    await writeFile(destPath, patchedContents);
    console.log(`  Wrote ${destPath}`);
  }
}

async function logAndExec(cmd, options) {
  console.log(cmd);
  return exec(cmd, options);
}

function getPatchedContents(srcFile, contents) {
  contents = updateCopyright(srcFile, contents);
  contents = fixNodeJsEventEmitterType(srcFile, contents);
  return contents;
}

function updateCopyright(srcFile, contents) {
  const curYear = new Date().getFullYear();
  const curYearCopyright = `Copyright ${curYear}`;
  if (contents.indexOf(curYearCopyright) > -1) {
    return contents;
  }
  console.log(`  Updating copyright year for: ${srcFile}`);
  return contents.replace(/Copyright \d{4}/, curYearCopyright);
}

/**
 * Replaces the `NodeJS.EventEmitter` type with a polyfilled
 * `NodeJsEventEmitter` type and includes an `import` line for it. This allows
 * removing the `@types/node` dependency to compile.
 */
function fixNodeJsEventEmitterType(srcFile, contents) {
  if (contents.indexOf('NodeJS.EventEmitter') === -1) {
    return contents;
  }

  console.log(`  Using NodeJS.EventEmitter polyfill type for: ${srcFile}`);

  contents = contents.replace(/NodeJS.EventEmitter/g, 'NodeJsEventEmitter');
  const lines = contents.split('\n');
  let lastImportLine = lines.length - 1;
  while (lastImportLine > 0 && lines[lastImportLine].indexOf('import ') !== 0) {
    lastImportLine--;
  }

  const srcDirDepth = srcFile.length - srcFile.replace(/\//g, '').length;
  const relativeSrcDir = '../'.repeat(srcDirDepth);

  lines.splice(
      lastImportLine + 1, 0,
      `import {NodeJsEventEmitter} from '${relativeSrcDir}node/types';`);
  contents = lines.join('\n');
  return contents;
}
