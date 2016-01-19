'use strict'

const semver = require('semver')

const exec = require('./util').exec
const logger = require('./logging').logger

function getSemverTags () {
  const gitTagCmd = 'git tag | sort -r -V'
  const tags = exec(gitTagCmd)
    .toString().split('\n').filter(semver.valid)
  return tags
}

function getMergeCommits (revRange) {
  const gitLogCmd = `git log ${revRange} --format='%s' --grep='^Merge pull request #[0-9]\\+ from '`
  const stdout = exec(gitLogCmd).toString().trimRight()
  const commits = stdout ? stdout.split('\n') : []
  logger.debug('Commits: %s', JSON.stringify(commits))
  return commits
}

function getPRs (commits) {
  const prRegex = /Merge pull request #(\d+) from /
  const prs = commits.map(function (line) {
    const match = prRegex.exec(line)
    if (match) {
      return parseInt(match[1], 10)
    }
    return false
  }).filter(Boolean)
  logger.debug('PRs: %s', JSON.stringify(prs))
  return prs
}

module.exports = {
  getMergeCommits,
  getPRs,
  getSemverTags
}
