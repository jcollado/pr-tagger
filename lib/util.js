'use strict'

const fs = require('fs')
const childProcess = require('child_process')
const path = require('path')

const ghUrl = require('github-url')

const logger = require('./logging').logger

function exec (command) {
  logger.debug('Command: %s', command)
  try {
    return childProcess.execSync(command)
  } catch (error) {
    logger.error(error)
    process.exit(1)
  }
}

function getUrl () {
  const pkgFile = path.join(process.cwd(), 'package.json')
  let url = {}
  if (!fs.existsSync(pkgFile)) {
    logger.warn('Package file not found: %s', pkgFile)
  } else {
    const pkgData = require(pkgFile)

    if (typeof pkgData.repository === 'undefined') {
      logger.warn('Repository field not found in package.json')
      return url
    }

    if (typeof pkgData.repository.type === 'undefined') {
      logger.warn('Repository type field not found in package.json')
      return url
    }

    if (pkgData.repository.type !== 'git') {
      logger.warn(
        'Repository type is not git in package.json: %s',
        pkgData.repository.type)
      return url
    }

    if (typeof pkgData.repository.url === 'undefined') {
      logger.warn('Repository URL not found in package.json')
      return url
    }

    url = ghUrl(pkgData.repository.url)
  }
  return url
}

module.exports = {
  exec,
  getUrl
}
