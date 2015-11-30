#!/usr/bin/env node
'use strict'
const childProcess = require('child_process')
const fs = require('fs')
const path = require('path')

const Command = require('commander').Command
const ghauth = require('ghauth')
const ghissues = require('ghissues')
const ghUrl = require('github-url')
const semverRegex = require('semver-regex')
const winston = require('winston')

const pkg = require('./package')

const logger = new winston.Logger({
  transports: [new winston.transports.Console()]
})
logger.cli()

function exec (command) {
  logger.debug('Command: %s', command)
  try {
    return childProcess.execSync(command)
  } catch (error) {
    logger.error(error)
    process.exit(1)
  }
}

function parseArguments (defaults, argv) {
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
    .parse(argv)

  return program
}

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

function writeComments (authOptions, program, prs, comment) {
  ghauth(authOptions, function (error, authData) {
    if (error) {
      logger.error('GitHub Authorization failure: %s', error)
      process.exit(1)
    }
    logger.debug('GitHub Authorization success for user: %s', authData.user)
    prs.forEach(function (pr) {
      logger.info('Checking PR#%d comments...', pr)
      ghissues.listComments(
        authData, program.user, program.project, pr,
        function (error, commentList) {
          if (error) {
            logger.error('Error checking PR#%d comments: %s', pr, error)
          } else {
            const commentBodies = commentList.map(comment => comment.body)
            const semverComments = commentBodies.filter(function (body) {
              return semverRegex().test(body)
            })

            if (semverComments.length > 0) {
              logger.warn(
                'Semver comments found in PR#%d: %s',
                pr, JSON.stringify(semverComments))
            } else {
              logger.info('Adding comment to PR#%d', pr)
              if (!program.dryRun) {
                ghissues.createComment(
                  authData, program.user, program.project, pr, comment,
                  function (error, comment) {
                    if (error) {
                      logger.error('Error adding comment to PR#%d: %s', pr, error)
                    } else {
                      logger.debug('Comment: %s', comment)
                    }
                  })
              }
            }
          }
        })
    })
  })
}

function main () {
  logger.info('%s v%s', pkg.name, pkg.version)

  const pkgFile = path.join(process.cwd(), 'package.json')
  let url = {}
  if (!fs.existsSync(pkgFile)) {
    logger.warn('File not found: %s', pkgFile)
  } else {
    const pkgData = require(pkgFile)
    if (typeof pkgData.repository === 'undefined' &&
        pkgData.repository.type !== 'git' &&
        typeof pkgData.repository.url === 'undefined') {
      logger.warn('Git repository URL not found')
    } else {
      url = ghUrl(pkgData.repository.url)
    }
  }

  const tags = exec("git tag --sort='-version:refname'")
    .toString().split('\n').filter(tag => semverRegex().test(tag))

  const defaults = {
    version: pkg.version,
    description: pkg.description,
    user: url.user,
    project: url.project,
    tag: tags[0],
    logLevel: 'info'
  }
  const program = parseArguments(defaults, process.argv)

  logger.level = program.logLevel
  logger.debug('url:', url)
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
    note: pkg.name,
    scopes: ['repo']
  }
  writeComments(authOptions, program, prs, toTag)
}

if (require.main === module) {
  main()
} else {
  exports.exec = exec
  exports.getMergeCommits = getMergeCommits
  exports.logger = logger
  exports.parseArguments = parseArguments
}
