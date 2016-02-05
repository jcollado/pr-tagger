import chai from 'chai'
import fs from 'fs'
import path from 'path'
import requireInject from 'require-inject'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import test from 'ava'

const expect = chai.expect
chai.use(sinonChai)

const packagePath = require.resolve('../../package')

test.beforeEach((t) => {
  const logger = {
    warn: sinon.spy()
  }
  const existsSync = sinon.stub()
  const ghUrl = sinon.stub()

  const stubs = {
    fs: {
      existsSync,
      readdirSync: fs.readdirSync,
      readFileSync: fs.readFileSync
    },
    'github-url': ghUrl,
    path: {
      basename: path.basename,
      extname: path.extname,
      join: sinon.stub().returns(packagePath),
      resolve: path.resolve
    },
    [require.resolve('../../src/logging')]: { logger }
  }
  const util = requireInject('../../src/util', stubs)
  t.context = { existsSync, ghUrl, logger, util }
})

test('util.getUrl: returns empty object on file not found', (t) => {
  const { existsSync, logger, util } = t.context
  existsSync.returns(false)

  const url = util.getUrl()
  expect(logger.warn).to.have.been.calledWith(
    'Package file not found: %s', packagePath)
  expect(url).to.deep.equal({})
})

function injectPkgData (pkgData, checkFn) {
  try {
    require.cache[packagePath] = {exports: pkgData}
    checkFn()
  } finally {
    delete require.cache[packagePath]
  }
}

test('util.getUrl: returns empty object on repository field not found', (t) => {
  const { existsSync, logger, util } = t.context
  existsSync.returns(true)

  injectPkgData({}, () => {
    const url = util.getUrl()
    expect(logger.warn).to.have.been.calledWith(
      'Repository field not found in package.json')
    expect(url).to.deep.equal({})
  })
})

test('util.getUrl: parses URL from repository in shortcut form', (t) => {
  const { existsSync, util } = t.context
  existsSync.returns(true)

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
    injectPkgData(pkgData, () => {
      const url = util.getUrl()
      expect(url).to.deep.equal({user, project})
    })
  })
})

test('util.getUrl: returns empty object on failure parsing repository in shortcut form', (t) => {
  const { existsSync, util } = t.context
  existsSync.returns(true)

  const repositories = [
    'gist:11081aaa281',
    'bitbucket:example/repo',
    'gitlab:another/repo'
  ]

  repositories.forEach((repository) => {
    const pkgData = {repository}
    injectPkgData(pkgData, () => {
      const url = util.getUrl()
      expect(url).to.deep.equal({})
    })
  })
})

test('util.getUrl: returns empty object on repository type not found', (t) => {
  const { existsSync, logger, util } = t.context
  existsSync.returns(true)

  const pkgData = {repository: {}}
  injectPkgData(pkgData, () => {
    const url = util.getUrl()
    expect(logger.warn).to.have.been.calledWith(
      'Repository type field not found in package.json')
    expect(url).to.deep.equal({})
  })
})

test('util.getUrl: returns empty object on repository type not git', (t) => {
  const { existsSync, logger, util } = t.context
  existsSync.returns(true)

  const repositoryType = 'some type'
  const pkgData = {repository: {type: repositoryType}}
  injectPkgData(pkgData, () => {
    const url = util.getUrl()
    expect(logger.warn).to.have.been.calledWith(
      'Repository type is not git in package.json: %s', repositoryType)
    expect(url).to.deep.equal({})
  })
})

test('util.getUrl: returns empty object on repository.url field not found', (t) => {
  const { existsSync, logger, util } = t.context
  existsSync.returns(true)

  const pkgData = {repository: {type: 'git'}}
  injectPkgData(pkgData, () => {
    const url = util.getUrl()
    expect(logger.warn).to.have.been.calledWith(
      'Repository URL not found in package.json')
    expect(url).to.deep.equal({})
  })
})

test('util.getUrl: parses URL from repository.url field', (t) => {
  const { existsSync, ghUrl, util } = t.context
  existsSync.returns(true)

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
  injectPkgData(pkgData, () => {
    const url = util.getUrl()
    expect(url).to.equal(expected)
  })
  expect(ghUrl).to.have.been.calledWith(pkgData.repository.url)
})
