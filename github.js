'use strict'

const exec = require('./util').exec
const logger = require('./logging').logger

function getMergeCommits (revRange) {
  const gitLogCmd = `git log ${revRange} --format='%s' --grep='^Merge pull request #[0-9]\\+ from '`
  const commits = exec(gitLogCmd).toString().trimRight().split('\n')
  logger.debug('Commits: %s', commits)
  return commits
}

function getPRs (commits) {
  const prs = commits.map(function (line) {
    const match = /Merge pull request #(\d+) from /.exec(line)
    if (match) {
      return parseInt(match[1], 10)
    }
    return false
  }).filter(Boolean)
  logger.debug('PRs: %s', prs)
  return prs
}

module.exports = {
  getMergeCommits,
  getPRs
}
