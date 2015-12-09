'use strict'

const promisify = require('promisify-node')
const ghauth = promisify('ghauth')
const ghissues = promisify('ghissues')

const logger = require('../logging').logger
const util = require('./util')

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
        const semverComments = util.getSemverComments(commentList)

        if (semverComments.length > 0) {
          logger.warn(
            'Semver comments found in PR#%d: %s',
            pr, JSON.stringify(semverComments))
          return
        }

        logger.info('Adding comment to PR#%d', pr)
        if (!program.dryRun) {
          util.writeComment(
            authData, program.user, program.project, pr, comment)
        }
        return pr
      },
      function (error) {
        logger.error('Error checking PR#%d comments: %s', pr, error)
      })
  }))
}

module.exports = {
  authorize,
  writeComments
}