#!/usr/bin/env node
const commitStream = require('commit-stream')
const listStream = require('list-stream')
const program = require('commander')
const split2 = require('split2')

const spawn = require('child_process').spawn

const version = require('./package').version

program
  .version(version)
  .parse(process.argv)

spawn('bash', ['-c', 'git log'])
  .stdout
    .pipe(split2())
    .pipe(commitStream())
    .pipe(listStream.obj(onCommitList))

function onCommitList (error, commitList) {
  if (error) throw error

  commitList.forEach(function (commit) {
    console.log(commit)
  })
}
