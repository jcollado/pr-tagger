#!/usr/bin/env node
'use strict'
const exec = require('child_process').execSync
const fs = require('fs')
const path = require('path')
const util = require('util')

const ghauth = require('ghauth')
const ghissues = require('ghissues')
const pkgToId = require('pkg-to-id')
const Command = require('commander').Command
const semverRegex = require('semver-regex')
const winston = require('winston')

const pkg = require('./package')

const logger = new winston.Logger({
  transports: [new winston.transports.Console()]
})
logger.cli()

function parseArguments (defaults) {
  const program = new Command()
    .version(defaults.version)
    .description(defaults.description)
    .option('-u, --user [user]', 'GitHub user', defaults.user)
    .option('-p, --project [project]', 'GitHub project', defaults.project)
    .option('-t, --tag [tag]', 'Git tag', defaults.tag)
    .option('-l, --log-level [logLevel]',
            'Log level',
            /^(error|warn|info|verbose|debug|silly)$/i,
            defaults.logLevel)
    .option('-n --dry-run',
            'Log actions, but skip adding comments to GitHub PRs')
    .parse(process.argv)

  return program
}

function getMergeCommits (revRange) {
  const gitLogCmd = `git log ${revRange} --format='%s' --grep='^Merge pull request #[0-9]\\+ from '`
  logger.debug('Command: %s', gitLogCmd)

  const commits = exec(gitLogCmd).toString().trimRight()
  logger.debug('Commits: %s', commits)
  return commits
}

function getPRs (commits) {
  const prs = commits.split('\n').map(function (line) {
    const match = /Merge pull request #(\d+) from /.exec(line)
    if (match) {
      return parseInt(match[1], 10)
    }
    return false
  }).filter(Boolean)
  logger.debug('PRs: %s', prs)
  return prs
}

function writeComments (authOptions, program, prs, comment) {
  ghauth(authOptions, function (error, authData) {
    if (error) {
      logger.error('GitHub Authorization failure: %s', error)
      process.exit(1)
    }
    logger.debug('GitHub Authorization success for user: %s', authData.user)
    prs.forEach(function (pr) {
      logger.info('Adding comment to PR#%d', pr)
      if (!program.dryRun) {
        ghissues.createComment(
          authData, program.user, program.project, pr, comment, function (error, comment) {
            if (error) {
              logger.error('Error adding comment to PR#%d: %s', pr, error)
            } else {
              logger.debug('Comment: %s', comment)
            }
          })
      }
    })

    logger.info('Done!')
  })
}

function main () {
  logger.info('%s v%s', pkg.name, pkg.version)

  const pkgFile = path.join(process.cwd(), 'package.json')
  const pkgData = fs.existsSync(pkgFile) ? require(pkgFile) : {}
  const pkgId = pkgToId(pkgData)
  const tags = exec("git tag --sort='-version:refname'")
    .toString().split('\n').filter(tag => semverRegex().test(tag))

  const defaults = {
    version: pkg.version,
    description: pkg.description,
    user: pkgId.user,
    project: pkgId.name,
    tag: tags[0],
    logLevel: 'info'
  }
  const program = parseArguments(defaults)

  logger.level = program.logLevel
  logger.debug('pkgId:', pkgId)
  logger.debug('Tags: %s', tags)
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
  const commits = getMergeCommits(revRange)
  const prs = getPRs(commits)

  const authOptions = {
    configName: pkg.name,
    note: util.format('%s: %s', pkg.name, pkg.description)
  }
  writeComments(authOptions, program, prs, toTag)
}

if (require.main === module) {
  main()
}
