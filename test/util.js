/* global describe it beforeEach */
'use strict'

const chai = require('chai')
const requireInject = require('require-inject')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')

const expect = chai.expect
chai.use(sinonChai)

describe('exec', function () {
  const command = 'some command'
  let stubs
  let logger

  beforeEach('create stubs', function () {
    logger = {
      cli: sinon.spy(),
      debug: sinon.spy(),
      error: sinon.spy()
    }

    stubs = {
      child_process: {
        execSync: sinon.stub()
      }
    }
    stubs[require.resolve('../lib/logging')] = {
      logger
    }
  })

  it('writes the command to the log', function () {
    const exec = requireInject('../lib/util', stubs).exec

    exec(command)
    expect(logger.debug).to.have.been.calledWith('Command: %s', command)
  })

  it('returns command stdout on success', function () {
    const expectedStdout = 'this is the command stdout'
    stubs.child_process.execSync.returns(expectedStdout)
    const exec = requireInject('../lib/util', stubs).exec

    const stdout = exec(command)
    expect(stdout).to.equal(expectedStdout)
  })

  it('logs error and exits on failure', function () {
    const expectedError = new Error('some error')
    stubs.child_process.execSync.throws(expectedError)
    const util = requireInject('../lib/util', stubs)

    sinon.stub(process, 'exit')
    try {
      util.exec(command)
      expect(logger.error).to.have.been.calledWith(expectedError)
      expect(process.exit).to.have.been.calledWith(1)
    } finally {
      process.exit.restore()
    }
  })
})

