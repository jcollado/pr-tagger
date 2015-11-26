#!/usr/bin/env node
'use strict'
const fs = require('fs')
const path = require('path')

const pkgToId = require('pkg-to-id')
const program = require('commander')
const winston = require('winston')


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

program
  .version(pkg.version)
  .description(pkg.description)
  .option('-u, --user [user]', 'GitHub [user]', pkgId.user)
  .option('-p, --project [project]', 'GitHub [project]', pkgId.name)
  .parse(process.argv)
logger.debug('program:', {user: program.user, project: program.project})



