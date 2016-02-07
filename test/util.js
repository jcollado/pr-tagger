/* global describe it beforeEach */
import chai from 'chai'
import requireInject from 'require-inject'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'

const expect = chai.expect
chai.use(sinonChai)

describe('util.exec', () => {
  const command = 'some command'
  let stubs
  let logger

  beforeEach('create stubs', () => {
    logger = {
      cli: sinon.spy(),
      debug: sinon.spy(),
      error: sinon.spy()
    }

    stubs = {
      child_process: { execSync: sinon.stub() },
      [require.resolve('../src/logging')]: { logger }
    }
  })

  it('writes the command to the log', () => {
    const exec = requireInject('../src/util', stubs).exec

    exec(command)
    expect(logger.debug).to.have.been.calledWith('Command: %s', command)
  })

  it('returns command stdout on success', () => {
    const expectedStdout = 'this is the command stdout'
    stubs.child_process.execSync.returns(expectedStdout)
    const exec = requireInject('../src/util', stubs).exec

    const stdout = exec(command)
    expect(stdout).to.equal(expectedStdout)
  })

  it('logs error and exits on failure', () => {
    const expectedError = new Error('some error')
    stubs.child_process.execSync.throws(expectedError)
    const util = requireInject('../src/util', stubs)

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

describe('util.getUrl', () => {
  let stubs
  let logger
  let existsSync
  let ghUrl
  const packagePath = require.resolve('../package')

  beforeEach('create stubs', () => {
    logger = {
      warn: sinon.spy()
    }
    existsSync = sinon.stub()
    ghUrl = sinon.stub()

    stubs = {
      fs: { existsSync },
      'github-url': ghUrl,
      path: { join: sinon.stub().returns(packagePath) },
      [require.resolve('../src/logging')]: { logger }
    }
  })

  it('returns empty object on file not found', () => {
    existsSync.returns(false)
    const util = requireInject('../src/util', stubs)

    const url = util.getUrl()
    expect(logger.warn).to.have.been.calledWith(
      'Package file not found: %s', packagePath)
    expect(url).to.deep.equal({})
  })

  function injectPkgData (pkgData, checkFn) {
    existsSync.returns(true)
    const util = requireInject('../src/util', stubs)

    try {
      require.cache[packagePath] = {exports: pkgData}
      const url = util.getUrl()
      checkFn(url)
    } finally {
      delete require.cache[packagePath]
    }
  }

  it('returns empty object on repository field not found', () => {
    const pkgData = {}
    injectPkgData(pkgData, (url) => {
      expect(logger.warn).to.have.been.calledWith(
        'Repository field not found in package.json')
      expect(url).to.deep.equal({})
    })
  })

  it('parses URL from repository in shortcut form', () => {
    const repositories = [
      'user/project',
      'some-user/project',
      'user/some-project'
    ]
    repositories.forEach((repository) => {
      const expected = repository.split('/')
      const user = expected[0]
      const project = expected[1]
      const pkgData = {repository}
      injectPkgData(pkgData, (url) => {
        expect(url).to.deep.equal({user, project})
      })
    })
  })

  it('returns empty object on failure parsing repository in shortcut form', () => {
    const repositories = [
      'gist:11081aaa281',
      'bitbucket:example/repo',
      'gitlab:another/repo'
    ]

    repositories.forEach((repository) => {
      const pkgData = {repository}
      injectPkgData(pkgData, (url) => {
        expect(url).to.deep.equal({})
      })
    })
  })

  it('returns empty object on repository type not found', () => {
    const pkgData = {repository: {}}
    injectPkgData(pkgData, (url) => {
      expect(logger.warn).to.have.been.calledWith(
        'Repository type field not found in package.json')
      expect(url).to.deep.equal({})
    })
  })

  it('returns empty object on repository type not git', () => {
    const repositoryType = 'some type'
    const pkgData = {repository: {type: repositoryType}}
    injectPkgData(pkgData, (url) => {
      expect(logger.warn).to.have.been.calledWith(
        'Repository type is not git in package.json: %s', repositoryType)
      expect(url).to.deep.equal({})
    })
  })

  it('returns empty object on repository.url field not found', () => {
    const pkgData = {repository: {type: 'git'}}
    injectPkgData(pkgData, (url) => {
      expect(logger.warn).to.have.been.calledWith(
        'Repository URL not found in package.json')
      expect(url).to.deep.equal({})
    })
  })

  it('parses URL from repository.url field', () => {
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

    injectPkgData(pkgData, (url) => {
      expect(url).to.equal(expected)
    })
    expect(ghUrl).to.have.been.calledWith(pkgData.repository.url)
  })
})
