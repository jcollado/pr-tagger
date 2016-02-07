import semver from 'semver'

import { exec } from './util'
import { logger } from './logging'

function getSemverTags () {
  const gitTagCmd = 'git tag'
  const tags = exec(gitTagCmd)
    .toString().split('\n').filter(semver.valid).sort(semver.rcompare)
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
  const prs = commits.map((line) => {
    const match = prRegex.exec(line)
    if (match) {
      return parseInt(match[1], 10)
    }
    return false
  }).filter(Boolean)
  logger.debug('PRs: %s', JSON.stringify(prs))
  return prs
}

export {
  getMergeCommits,
  getPRs,
  getSemverTags
}
