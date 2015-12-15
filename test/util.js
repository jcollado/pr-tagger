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
  let existsSync
  let ghUrl
  const packagePath = require.resolve('../package')

  beforeEach('create stubs', function () {
    logger = {
      warn: sinon.spy()
    }
    existsSync = sinon.stub()
    ghUrl = sinon.stub()

    stubs = {
      fs: {
        existsSync
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

  it('returns empty object on file not found', function () {
    existsSync.returns(false)
    const util = requireInject('../lib/util', stubs)

    const url = util.getUrl()
    expect(logger.warn).to.have.been.calledWith(
      'Package file not found: %s', packagePath)
    expect(url).to.deep.equal({})
  })

  function injectPkgData (pkgData, checkFn) {
    existsSync.returns(true)
    const util = requireInject('../lib/util', stubs)

    try {
      require.cache[packagePath] = {exports: pkgData}
      const url = util.getUrl()
      checkFn(url)
    } finally {
      delete require.cache[packagePath]
    }
  }

  it('returns empty object on repository field not found', function () {
    const pkgData = {}
    injectPkgData(pkgData, function (url) {
      expect(logger.warn).to.have.been.calledWith(
        'Repository field not found in package.json')
      expect(url).to.deep.equal({})
    })
  })

  it('parses URL from repository in shortcut form', function () {
    const pkgData = {repository: 'user/project'}
    injectPkgData(pkgData, function (url) {
      expect(url).to.deep.equal({user: 'user', project: 'project'})
    })
  })

  it('returns empty object on repository type not found', function () {
    const pkgData = {repository: {}}
    injectPkgData(pkgData, function (url) {
      expect(logger.warn).to.have.been.calledWith(
        'Repository type field not found in package.json')
      expect(url).to.deep.equal({})
    })
  })

  it('returns empty object on repository type not git', function () {
    const repositoryType = 'some type'
    const pkgData = {repository: {type: repositoryType}}
    injectPkgData(pkgData, function (url) {
      expect(logger.warn).to.have.been.calledWith(
        'Repository type is not git in package.json: %s', repositoryType)
      expect(url).to.deep.equal({})
    })
  })

  it('returns empty object on repository.url field not found', function () {
    const pkgData = {repository: {type: 'git'}}
    injectPkgData(pkgData, function (url) {
      expect(logger.warn).to.have.been.calledWith(
        'Repository URL not found in package.json')
      expect(url).to.deep.equal({})
    })
  })

  it('parses URL from repository.url field', function () {
    const expected = {
      user: 'some user',
      project: 'some project'
    }
    ghUrl.returns(expected)

    const pkgData = {
      repository: {
        type: 'git',
        url: 'some url'
      }
    }

    injectPkgData(pkgData, function (url) {
      expect(url).to.equal(expected)
    })
    expect(ghUrl).to.have.been.calledWith(pkgData.repository.url)
  })
})
