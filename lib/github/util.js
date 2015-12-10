'use strict'

const promisify = require('promisify-node')
const ghissues = promisify('ghissues')
const semverRegex = require('semver-regex')

const logger = require('../logging').logger

function writeComment (authData, user, project, pr, comment) {
  return ghissues.createComment(authData, user, project, pr, comment).then(
    function (comment) {
      logger.debug('Comment added to PR#%d: %s', pr, comment)
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
  getSemverComments,
  writeComment
}
