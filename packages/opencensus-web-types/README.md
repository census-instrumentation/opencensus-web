# OpenCensus Web types

Since both OpenCensus Web and OpenCensus Node are designed for JavaScript
applications, we would like to keep type compatibility between them.

However the `@opencensus/core` package includes some Node-specific dependencies
that make it difficult to import in web-specific packages. This will be
particularly true once OpenCensus Web supports building with Bazel (see
[rules_typescript](https://github.com/bazelbuild/rules_typescript) on GitHub).

This package resolves these dependency issues by copying the `types.ts` and
supporting files from the `@opencensus/core`. It also uses a polyfill for the
`NodeJS.EventEmitter` type to avoid a dependency on the `@types/node` package.

To refresh the types for a new release of `@opencensus/core`, modify the
`copytypes` command in the `package.json` file with the git tag of the new
release. You may need to also modify the list of copied files or the patching
logic in the `scripts/copy-types.js` file.
