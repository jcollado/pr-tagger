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
    name: pkg.name,
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
  logger.debug('url: %s', JSON.stringify(url))
  logger.debug('Tags: %s', JSON.stringify(tags))
  logger.debug('program:', {
    name: program.name,
    user: program.user,
    project: program.project,
    tag: program.tag,
    logLevel: program.logLevel,
    dryRun: program.dryRun
  })

  if (typeof program.user === 'undefined') {
    logger.error(
      'User name not found in package.json. ' +
      'Use -u/--user to pass it explicitly.')
    return Promise.resolve(1)
  }

  if (typeof program.project === 'undefined') {
    logger.error(
      'Project name not found in package.json. ' +
      'Use -p/--project to pass it explicitly')
    return Promise.resolve(1)
  }

  if (tags.length === 0) {
    logger.error('No tags found in repository')
    return Promise.resolve(1)
  }
  if (!semverRegex().test(program.tag)) {
    logger.error('Tag not semver compliant: %s', program.tag)
    return Promise.resolve(1)
  }

  const toTagIndex = tags.indexOf(program.tag)
  if (toTagIndex === -1) {
    logger.error('Tag not found in repository: %s', program.tag)
    return Promise.resolve(1)
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
  return github.authorize(authOptions, program)
    .then(authData => github.writeComments(authData, program, prs, toTag))
    .then(function (commentList) {
      logger.info(
        '%d comments written',
        commentList.filter(comment => comment !== null).length)
      logger.info('Done!')
      return Promise.resolve(0)
    })
    .catch(error => {
      logger.error('Unexpected error: %s', error)
      return Promise.resolve(1)
    })
}

module.exports = main
