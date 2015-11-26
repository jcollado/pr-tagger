#!/usr/bin/env node
'use strict'
const fs = require('fs')
const path = require('path')

const pkgToId = require('pkg-to-id')
const program = require('commander')
const semverRegex = require('semver-regex')
const winston = require('winston')

const exec = require('child_process').execSync

const pkg = require('./package')

const pkgFile = path.join(process.cwd(), 'package.json')
const pkgData = fs.existsSync(pkgFile) ? require(pkgFile) : {}
const pkgId = pkgToId(pkgData)

const logger = new winston.Logger({
  transports: [new winston.transports.Console()]
})
logger.cli()
logger.info('%s v%s', pkg.name, pkg.version)

const tags = exec("git tag --sort='-version:refname'")
  .toString().split('\n').filter(tag => semverRegex().test(tag))

program
  .version(pkg.version)
  .description(pkg.description)
  .option('-u, --user [user]', 'GitHub user', pkgId.user)
  .option('-p, --project [project]', 'GitHub project', pkgId.name)
  .option('-t, --tag [tag]', 'Git tag', tags[0])
  .option('-l, --log-level [logLevel]',
          'Log level',
          /^(error|warn|info|verbose|debug|silly)$/i,
          'info')
  .parse(process.argv)

logger.level = program.logLevel
logger.debug('program:', {
  user: program.user,
  project: program.project,
  tag: program.tag,
  logLevel: program.logLevel
})
logger.debug('pkgId:', pkgId)
logger.debug('Tags: %s', tags)

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
const gitLogCmd = `git log ${revRange} --format='%s' --grep='^Merge pull request #[0-9]\\+ from '`
logger.debug('Command: %s', gitLogCmd)

const commits = exec(gitLogCmd).toString().trimRight()
logger.debug('Commits: %s', commits)

const prs = commits.split('\n').map(function (line) {
  const match = /Merge pull request #(\d+) from /.exec(line)
  if (match) {
    return match[1]
  }
  return false
}).filter(Boolean)
logger.debug('PRs: %s', prs)

