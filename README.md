# pr-tagger

[![Build Status](https://travis-ci.org/jcollado/pr-tagger.svg?branch=master)](https://travis-ci.org/jcollado/pr-tagger)
[![Dependency Status](https://david-dm.org/jcollado/pr-tagger.svg)](https://david-dm.org/jcollado/pr-tagger)
[![devDependency Status](https://david-dm.org/jcollado/pr-tagger/dev-status.svg)](https://david-dm.org/jcollado/pr-tagger#info=devDependencies)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

Add comment to pull requests in GitHub with version tag for latest release.

This is a command-line tool to help automate this workflow:
- Multiple pull requests are created in GitHub.
- Pull requests are merged using GitHub web UI.
- A new version of the project is released and tagged.
- A comment is added to every pull request using as content the tag.

Adding a comment with the relased tag to every pull request might be useful in the future to quickly figure out in which version some changes were released. However, it might be tedious to go through the git log to figure out which pull requests where merged in a given release. Fortunately, this can be easily automated and that's exactly what this tool does.


## Installation

```bash
npm install -g pr-tagger
```

## Usage

- Add comment with latest version tag to merged PRs:

```bash
pr-tagger
```

- Add comment for particular version tag to merged PRs:

```bash
pr-tagger -t <tag>
```
