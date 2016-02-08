import promisify from 'promisify-object'
import semverRegex from 'semver-regex'

const ghissues = promisify(require('ghissues'), ['createComment', 'list'])

import {logger} from '../logging'

function writeComment (authData, owner, project, pr, comment) {
  return ghissues.createComment(authData, owner, project, pr, comment).then(
    ([comment]) => {
      logger.debug('Comment added to PR#%d: %s', pr, comment.html_url)
    },
    (error) => {
      logger.error('Error adding comment to PR#%d: %s', pr, error)
    })
}

function getSemverComments (commentList) {
  const commentBodies = commentList.map((comment) => comment.body)
  const semverComments = commentBodies.filter((body) => semverRegex().test(body))
  return semverComments
}

function checkAuthorization (authData, program) {
  // Get issues to make sure GitHub authorization has been successful
  return ghissues.list(authData, program.owner, program.project)
    .then(() => {
      logger.debug('GitHub Authorization success for user: %s', authData.user)
    })
    .then(() => {
      return Promise.resolve(authData)
    })
}

export {
  checkAuthorization,
  getSemverComments,
  writeComment
}
