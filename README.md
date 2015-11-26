# pr-tagger

[![Build Status](https://travis-ci.org/jcollado/pr-tagger.svg?branch=master)](https://travis-ci.org/jcollado/pr-tagger)
[![Dependency Status](https://david-dm.org/jcollado/pr-tagger.svg)](https://david-dm.org/jcollado/pr-tagger)
[![devDependency Status](https://david-dm.org/jcollado/pr-tagger/dev-status.svg)](https://david-dm.org/jcollado/pr-tagger#info=devDependencies)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

Add comment to PRs in GitHub with version tag for latest release

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
