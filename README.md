# pr-tagger

[![npm](https://img.shields.io/npm/v/pr-tagger.svg)](https://www.npmjs.com/package/pr-tagger)
[![Build Status](https://travis-ci.org/jcollado/pr-tagger.svg?branch=master)](https://travis-ci.org/jcollado/pr-tagger)
[![Coverage Status](https://coveralls.io/repos/jcollado/pr-tagger/badge.svg?branch=master&service=github)](https://coveralls.io/github/jcollado/pr-tagger?branch=master)
[![Dependency Status](https://david-dm.org/jcollado/pr-tagger.svg)](https://david-dm.org/jcollado/pr-tagger)
[![devDependency Status](https://david-dm.org/jcollado/pr-tagger/dev-status.svg)](https://david-dm.org/jcollado/pr-tagger#info=devDependencies)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

Add comment to pull requests in GitHub with version tag for latest release.

This is a command-line tool to help automate this workflow:
- Multiple pull requests are created in GitHub.
- Pull requests are merged using GitHub web UI.
- A new version of the project is released and tagged.
- A comment is added to every pull request using as content the tag.

Adding a comment with the released tag to every pull request might be useful in the future to quickly figure out in which version some changes were released. However, it's tedious to go through the git log output to figure out which pull requests where merged in a given release. Fortunately, this can be easily automated and that's exactly what this tool does.


## Installation

The recommended way to install `pr-tagger` is as a development dependency for a project:

```bash
npm install --save-dev pr-tagger
```

and then integrate it in the project workflow as an `npm` script. More information about this in the [configuration section](#configuration) below.

However, when the tool is installed for the first time, it's fine to install it globally and give it a try from the command line:

```bash
npm install -g pr-tagger
```

## Usage

*Note*: Please use the `-n/--dry-run` option when testing the tool to make sure no comment is actually added to a github pull request.

- Add comment with latest version tag to merged PRs:

```bash
pr-tagger
```

- Same as above for a project without standard [`repository`](https://docs.npmjs.com/files/package.json#repository) data in its `package.json` file:
```bash
pr-tagger -u <user> -p <project>
```

- Add comment for particular version tag to merged PRs:

```bash
pr-tagger -t <tag>
```

## Command line options

- `-u/--user [user]`: GitHub user
- `-p/--project [project]`: GitHub project

GitHub user and project name fields are extracted from the `package.json` file found in the same directory where the script is invoked. In particular, it's extracted from the `repository.url` field if `repository.type` is set to `git`. If the `package.json` file is not found or the parsing code fails (please open a new [issue](https://github.com/jcollado/pr-tagger/issues/new) if that happens), then it's still possible to use these flags to set the parameters manually.

- `-t/--tag [tag]`: Git tag

The most recent tag is used as the latest commit to look for merge messages by default. If the tag for which comments should be added is not the most recent one, use this option to set it to any semver valid tag present in the repository.

- `-l/--log-level [logLevel]`: Log level

This flag can be used to set the level of verbosity of the output. The default value is `info` which outputs a reasonable amount of information. To troubleshoot problems, `debug` is recommended.

- `-n/--dry-run`: Log actions, but skip adding comments to GitHub PRs

When this option is set, all the actions that the tool would normally do will be performed, except for writing comments to the GitHub pull requests for which no semver comment was found.

## Configuration

There's no need to run `pr-tagger` manually for every new release. Different options to do it automatically are:
- Use `npm` scripts (`postversion`/`postpublish`)
- Use an after deploy command in your preferred continuous integration service

For example, `pr-tagger` itself is released using `npm version` as follows:
- Test cases are executed locally thanks to the `preversion` script
- A commit is created and tagged (that's what `npm version` does)
- The commit and the tag are pushed to git using the `postversion` script
- `pr-tagger` is also executed as part of the `postversion` script
- The test cases are executed again in travis and the package is published on `npm` on success

## Contributing

Any contribution is more than welcome. In particular, if:

- there's something that doesn't work as expected or you have an idea for a nice to have feature, then please submit an issue [here](https://github.com/jcollado/pr-tagger/issues/new)
- you know how to fix a problem or improve the code, then please sumbit a pull request [here](https://github.com/jcollado/pr-tagger/compare)
