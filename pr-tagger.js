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
  level: 'debug',
  transports: [new winston.transports.Console()]
})
logger.cli()

logger.info('%s v%s', pkg.name, pkg.version)
logger.debug('pkgId:', pkgId)

const tags = exec("git tag --sort='-version:refname'")
  .toString().split('\n').filter(tag => semverRegex().test(tag))
logger.debug('Tags: %s', tags)

program
  .version(pkg.version)
  .description(pkg.description)
  .option('-u, --user [user]', 'GitHub user', pkgId.user)
  .option('-p, --project [project]', 'GitHub project', pkgId.name)
  .option('-t, --tag [tag]', 'Git tag', tags[0])
  .parse(process.argv)
logger.debug('program:', {
  user: program.user,
  project: program.project,
  tag: program.tag
})

if (tags.length === 0) {
  logger.error('No tags found in repository')
  process.exit(1)
}
if (!semverRegex().test(program.tag)) {
  logger.error('Tag not semver compliant: %s', program.tag)
  process.exit(1)
}
if (tags.indexOf(program.tag) === -1) {
  logger.error('Tag not found in repository: %s', program.tag)
  process.exit(1)
}

