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
pr-tagger -o <owner> -p <project>
```

- Add comment for particular version tag to merged PRs:

```bash
pr-tagger -t <tag>
```

## Command line options

- `-p/--project [project]`: GitHub project
- `-o/--owner [user]`: GitHub repository owner

GitHub repository owner and project name fields are extracted from the `package.json` file found in the same directory where the script is invoked. In particular, they are extracted from the `repository.url` field if `repository.type` is set to `git`. If the `package.json` file is not found or the parsing code fails (please open a new [issue](https://github.com/jcollado/pr-tagger/issues/new) if that happens), then it's still possible to use these flags to set the parameters manually.

- `-a/--access-token [token]`: GitHub access token
- `-u/--user [user]`: GitHub user

GiHub access token and user to access the repository content and be able to write comments in pull requests. By default the GitHub user is assumed to be the same one as the repository owner and the access token is `undefined`. If no token is explicitly passed, the user will be prompted to enter GitHub user and password the first time to persist it to a file that will be used in the future without asking the user again for any password. The `-a/--access-token` option is specially useful in continuous integration environments, where no configuration file will be persisted, as described in the [configuration section](#configuration) below.

- `-t/--tag [tag]`: Git tag

The most recent tag is used as the latest commit to look for merge messages by default. If the tag for which comments should be added is not the most recent one, use this option to set it to any semver valid tag present in the repository.

- `-l/--log-level [logLevel]`: Log level

This flag can be used to set the level of verbosity of the output. The default value is `info` which outputs a reasonable amount of information. To troubleshoot problems, `debug` is recommended.

- `-n/--dry-run`: Log actions, but skip adding comments to GitHub PRs

When this option is set, all the actions that the tool would normally do will be performed, except for writing comments to the GitHub pull requests for which no semver comment was found.

## Configuration

Despite `pr-tagger` can be manually executed after every new release, there's no need to do so. Available alternatives are:

- `npm` scripts

The `postversion` script can be used to push changes and tags to the GitHub repository and add comments to pull requests with `pr-tagger` as follows:

```json
{
  "scripts": {
    "postversion": "git push && git push --tags && pr-tagger",
  }
}
```

Similarly, the `postpublish` script could be used as well with the same purpose.

- Deploy command in contiuous integration

For example, if you're using travis, `pr-tagger` can be configured to run after deployment to `npm` like this:

```yaml
after_deploy:
- pr-tagger --access-token ${GH_TOKEN}
env:
  global:
    secure: <encripted_value>
```

where the `GH_TOKEN` environment variable is set in the job configuration using the [`travis`](https://github.com/travis-ci/travis.rb#readme) command line tool:

```bash
travis encrypt GH_TOKEN=<value> --add
```

Alternatively, the web client also allows to enter environment variable values in the job configuration page.


## Contributing

Any contribution is more than welcome. In particular, if:

- there's something that doesn't work as expected or you have an idea for a nice to have feature, then please submit an issue [here](https://github.com/jcollado/pr-tagger/issues/new)
- you know how to fix a problem or improve the code, then please submit a pull request [here](https://github.com/jcollado/pr-tagger/compare)
