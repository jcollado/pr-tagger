'use strict'

const promisify = require('promisify-node')

const ghauth = promisify('ghauth')
const ghissues = promisify('ghissues')
const semverRegex = require('semver-regex')

const logger = require('./logging').logger

function authorize (authOptions) {
  return ghauth(authOptions).then(
    function (authData) {
      logger.debug('GitHub Authorization success for user: %s', authData.user)
      return authData
    },
    function (error) {
      logger.error('GitHub Authorization failure: %s', error)
      process.exit(1)
    })
}

function writeComments (authData, program, prs, comment) {
  return Promise.all(prs.map(function (pr) {
    logger.info('Checking PR#%d comments...', pr)
    return ghissues.listComments(authData, program.user, program.project, pr)
    .then(
      function (commentList) {
        const semverComments = getSemverComments(commentList)

        if (semverComments.length > 0) {
          logger.warn(
            'Semver comments found in PR#%d: %s',
            pr, JSON.stringify(semverComments))
          return
        }

        logger.info('Adding comment to PR#%d', pr)
        if (!program.dryRun) {
          writeComment(
            authData, program.user, program.project, pr, comment)
        }
        return pr
      },
      function (error) {
        logger.error('Error checking PR#%d comments: %s', pr, error)
      })
  }))
}

function writeComment (authData, user, project, pr, comment) {
  return ghissues.createComment(authData, user, project, pr, comment).then(
    function (comment) {
      logger.debug('Comment: %s', comment)
    },
    function (error) {
      logger.error('Error adding comment to PR#%d: %s', pr, error)
    })
}

function getSemverComments (commentList) {
  const commentBodies = commentList.map(comment => comment.body)
  const semverComments = commentBodies.filter(function (body) {
    return semverRegex().test(body)
  })
  return semverComments
}

module.exports = {
  authorize,
  getSemverComments,
  writeComment,
  writeComments
}
