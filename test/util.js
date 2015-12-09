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

describe('getUrl', function () {
  let stubs
  let logger
  let ghUrl
  const packagePath = require.resolve('../package')

  beforeEach('create stubs', function () {
    logger = {
      cli: sinon.spy(),
      debug: sinon.spy(),
      error: sinon.spy()
    }
    ghUrl = sinon.stub()

    stubs = {
      fs: {
        existsSync: sinon.stub().returns(true)
      },
      'github-url': ghUrl,
      path: {
        join: sinon.stub().returns(packagePath)
      }
    }
    stubs[require.resolve('../lib/logging')] = {
      logger
    }
  })

  it('parses URL from repository.url field', function () {
    const util = requireInject('../lib/util', stubs)
    const expected = {
      user: 'some user',
      project: 'some project'
    }
    ghUrl.returns(expected)
    try {
      require.cache[packagePath] = {
        exports: {
          repository: {
            type: 'git',
            url: 'some url'
          }
        }
      }
      const url = util.getUrl()
      expect(url).to.equal(expected)
    } finally {
      delete require.cache[packagePath]
    }
    expect(ghUrl).to.have.been.calledWith('some url')
  })
})
