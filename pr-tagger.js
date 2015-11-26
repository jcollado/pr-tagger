#!/usr/bin/env node
'use strict'
const fs = require('fs')
const path = require('path')

const pkgToId = require('pkg-to-id')
const program = require('commander')


const pkg = require('./package')
const debug = require('debug')(pkg.name)

const pkgFile = path.join(process.cwd(), 'package.json')
const pkgData = fs.existsSync(pkgFile) ? require(pkgFile) : {}
const pkgId = pkgToId(pkgData)

debug(pkg.name + ' v' + pkg.version)
debug('pkgId: ' + JSON.stringify(pkgId))

program
  .version(pkg.version)
  .description(pkg.description)
  .option('-u, --user [user]', 'GitHub [user]', pkgId.user)
  .option('-p, --project [project]', 'GitHub [project]', pkgId.name)
  .parse(process.argv)



