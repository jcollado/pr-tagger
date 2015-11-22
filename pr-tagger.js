#!/usr/bin/env node
'use strict'
const fs = require('fs')
const path = require('path')

const commitStream = require('commit-stream')
const listStream = require('list-stream')
const pkgToId = require('pkg-to-id')
const program = require('commander')
const split2 = require('split2')

const spawn = require('child_process').spawn

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

spawn('bash', ['-c', 'git log --pretty=full'])
  .stdout
    .pipe(split2())
    .pipe(commitStream(program.user, program.project))
    .pipe(listStream.obj(onCommitList))

function onCommitList (error, commitList) {
  if (error) throw error

  commitList.forEach(function (commit) {
    console.log(commit)
  })
}
