# Releasing OpenCensus Node Packages (for Maintainers Only)

This document explains how to publish all OC Node modules at version x.y.z.
Ensure that you’re following [semver][semver-url] when choosing a version number.

## Update to latest locally

Use `git fetch` and `git checkout origin/master` to ensure you’re on the latest
commit. Make sure you have no unstaged changes. Ideally, also use
`git clean -dfx` to remove all ignored and untracked files.

## Create a new branch

Create a new branch called `x.y.z-proposal` from the current commit.

## Install packages and run the version bump script

Run `npm install` to make sure the packages are installed and built. Then run
`npm run bump`, pick the version for `x.y.z`, and enter `y` for 
`Are you sure you want to publish these packages?` (They will not actually be
published, just the version will be bumped).

The version bump should create some unstaged changes.

## Create a new commit

Create a new commit with the exact title: `chore(multiple): x.y.z release proposal`.

## Create a draft GitHub Release

On [GitHub Releases][github-releases-url],
follow the example set by recent releases to populate a summary of changes, as 
well as a list of commits that were applied since the last release. 
Running `git log --oneline --no-decorate` is a good way to get that list of
commits. Save it as a draft, don’t publish it. Don’t forget the tag -- call it 
`vx.y.z` and leave it pointing at `master` for now (this can be changed as long
as the GitHub release isn’t published).

## Create a new PR

Push the branch to GitHub and create a new PR with that exact name. The commit
body should just be a link to the *draft* notes. Someone who can access draft
notes should approve it, looking in particular for test passing, and whether the
draft notes are satisfactory.

## Merge and pull

Merge the PR, and pull the changes locally (using the commands in the first 
step). Ensure that `chore(multiple): x.y.z release proposal` is the most recent
commit.

## Publish the GitHub Release

Publish the GitHub release, ensuring that the tag points to the newly landed
commit corresponding to release proposal `x.y.z`.

## NPM publish happens automatically via CircleCI

Publishing the GitHub release will cause the release commit to be tagged as 
`vx.y.z`, which triggers a CircleCI `publish_npm` job that automatically
publishes the packages to NPM. See the 
[OpenCensus Web CircleCI config][oc-web-circleci-url]

## Update CHANGELOG and release versions in examples
* After releasing, you need to update all examples to the latest version.
* In addition, update the CHANGELOG.md and start new Unreleased label.
* Create a new commit with the exact title: `Post Release: update CHANGELOG, Examples and ReadMe`.
* Go through PR review and merge it to GitHub master branch.

[semver-url]: https://semver.org/
[github-releases-url]: https://github.com/census-instrumentation/opencensus-web/releases
[oc-web-circleci-url]: https://github.com/census-instrumentation/opencensus-web/blob/master/.circleci/config.yml
