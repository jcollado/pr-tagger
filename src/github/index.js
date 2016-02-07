import {format} from 'util'

import applicationConfig from 'application-config'
import promisify from 'promisify-object'

const ghauth = promisify(require('ghauth'))
const ghissues = promisify(require('ghissues'), ['listComments'])

import {logger} from '../logging'
import util from './util'

function authorize (program) {
  let authPromise
  let badCredentialsMessage

  if (typeof program.accessToken !== 'undefined') {
    authPromise = Promise.resolve({
      user: program.user,
      token: program.accessToken
    })
    badCredentialsMessage = ('\n\n' +
      'To troubleshoot the problem, ' +
      'please make sure that the token passed through the command line ' +
      'matches the personal access token in your GitHub account settings.')
  } else {
    const authOptions = {
      configName: program.name,
      note: program.name,
      scopes: ['repo']
    }
    authPromise = ghauth(authOptions)
    badCredentialsMessage = format('\n\n' +
      'To troubleshoot the problem, ' +
      'please make sure that the token in %s configuration file (%s) ' +
      'matches the personal access token in your GitHub account settings. ' +
      'Alternatively, remove the configuration file to generate a new token',
      program.name,
      applicationConfig(program.name).filePath)
  }

  return authPromise
  .then((authData) => {
    return util.checkAuthorization(authData, program)
  })
  .catch((error) => {
    let message = format('GitHub Authorization failure: %s', error)
    if (error.message.includes('Bad credentials')) {
      message += badCredentialsMessage
    }
    return Promise.reject(message)
  })
}

function writeComments (authData, program, prs, comment) {
  return Promise.all(prs.map((pr) => {
    logger.info('Checking PR#%d comments...', pr)
    return ghissues.listComments(authData, program.owner, program.project, pr)
      .then(
        (commentList) => {
          const semverComments = util.getSemverComments(commentList)

          if (semverComments.length > 0) {
            logger.warn(
              'Semver comments found in PR#%d: %s',
              pr, JSON.stringify(semverComments))
            return null
          }

          logger.info('Adding comment to PR#%d...', pr)
          if (!program.dryRun) {
            return util.writeComment(
              authData, program.owner, program.project, pr, comment)
          }

          return null
        },
        (error) => {
          logger.error('Error checking PR#%d comments: %s', pr, error)
          return null
        })
  }))
}

export {
  authorize,
  writeComments
}
