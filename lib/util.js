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
    logger.warn('File not found: %s', pkgFile)
  } else {
    const pkgData = require(pkgFile)
    if (typeof pkgData.repository === 'undefined' ||
        pkgData.repository.type !== 'git' ||
        typeof pkgData.repository.url === 'undefined') {
      logger.warn('Git repository URL not found')
    } else {
      url = ghUrl(pkgData.repository.url)
    }
  }
  return url
}

module.exports = {
  exec,
  getUrl
}
