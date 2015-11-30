'use strict'

const childProcess = require('child_process')

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

module.exports = {
  exec
}
