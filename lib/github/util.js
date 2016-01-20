'use strict'

const promisify = require('promisify-object')
const ghissues = promisify(require('ghissues'), ['createComment', 'list'])
const semverRegex = require('semver-regex')

const logger = require('../logging').logger

function writeComment (authData, owner, project, pr, comment) {
  return ghissues.createComment(authData, owner, project, pr, comment).then(
    function (comment) {
      logger.debug('Comment added to PR#%d: %s', pr, JSON.stringify(comment))
    },
    function (error) {
      logger.error('Error adding comment to PR#%d: %s', pr, error)
    })
}

function getSemverComments (commentList) {
  const commentBodies = commentList.map(comment => comment.body)
  const semverComments = commentBodies.filter(body => semverRegex().test(body))
  return semverComments
}

function checkAuthorization (authData, program) {
  // Get issues to make sure GitHub authorization has been successful
  const promise = ghissues.list(authData, program.owner, program.project)
  promise.then(function () {
    logger.debug('GitHub Authorization success for user: %s', authData.user)
  })
  return promise.then(function () {
    return Promise.resolve(authData)
  })
}

module.exports = {
  checkAuthorization,
  getSemverComments,
  writeComment
}
