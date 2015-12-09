'use strict'
const semverRegex = require('semver-regex')

const git = require('./git')
const github = require('./github')
const logger = require('./logging').logger
const parseArguments = require('./arguments').parseArguments
const pkg = require('../package')
const util = require('./util')

function main () {
  const url = util.getUrl()
  const tags = git.getSemverTags()

  const defaults = {
    version: pkg.version,
    description: pkg.description,
    user: url.user,
    project: url.project,
    tag: tags[0],
    logLevel: 'info'
  }
  const program = parseArguments(defaults, process.argv)

  logger.level = program.logLevel
  logger.info('%s v%s', pkg.name, pkg.version)
  logger.debug('url:', url)
  logger.debug('Tags: %s', JSON.stringify(tags))
  logger.debug('program:', {
    user: program.user,
    project: program.project,
    tag: program.tag,
    logLevel: program.logLevel,
    dryRun: program.dryRun
  })

  if (tags.length === 0) {
    logger.error('No tags found in repository')
    process.exit(1)
  }
  if (!semverRegex().test(program.tag)) {
    logger.error('Tag not semver compliant: %s', program.tag)
    process.exit(1)
  }

  const toTagIndex = tags.indexOf(program.tag)
  if (toTagIndex === -1) {
    logger.error('Tag not found in repository: %s', program.tag)
    process.exit(1)
  }
  const toTag = program.tag
  const fromTag = tags[toTagIndex + 1]

  const revRange = (typeof fromTag !== 'undefined') ? `${fromTag}..${toTag}` : toTag
  const commits = git.getMergeCommits(revRange)
  const prs = git.getPRs(commits)

  const authOptions = {
    configName: pkg.name,
    note: pkg.name,
    scopes: ['repo']
  }
  github.authorize(authOptions)
    .then(authData => github.writeComments(authData, program, prs, toTag))
    .then(() => logger.info('Done!'))
    .catch(error => logger.error('Unexpected error: %s', error))
}

module.exports = main
