/* globals describe it beforeEach */
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import requireInject from 'require-inject'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import 'sinon-as-promised'

const expect = chai.expect
chai.use(chaiAsPromised)
chai.use(sinonChai)

describe('main', () => {
  let stubs
  let getUrl
  let git
  let github
  let logger
  let parseArguments

  beforeEach('create stubs', () => {
    getUrl = sinon.stub().returns('some url')
    git = {
      getSemverTags: sinon.stub(),
      getMergeCommits: sinon.stub(),
      getPRs: sinon.stub()
    }
    github = {
      authorize: sinon.stub(),
      writeComments: sinon.stub()
    }
    logger = {
      debug: sinon.spy(),
      info: sinon.spy(),
      error: sinon.spy()
    }
    parseArguments = sinon.stub()
    stubs = {
      [require.resolve('../src/arguments')]: { parseArguments },
      [require.resolve('../src/git')]: git,
      [require.resolve('../src/github')]: github,
      [require.resolve('../src/logging')]: { logger },
      [require.resolve('../src/util')]: { getUrl }
    }
  })

  it('returns when user name is not found', () => {
    git.getSemverTags.returns(['a tag', 'another tag'])
    parseArguments.returns({logLevel: 'debug'})
    const main = requireInject('../src/main', stubs).default
    return expect(main()).to.be.fulfilled.then((retcode) => {
      expect(retcode).to.equal(1)
      expect(logger.error).to.have.been.calledWith(
        'User name not found in package.json. ' +
        'Use -u/--user to pass it explicitly.')
    })
  })

  it('returns when project name is not found', () => {
    git.getSemverTags.returns(['a tag', 'another tag'])
    parseArguments.returns({logLevel: 'debug', user: 'user'})
    const main = requireInject('../src/main', stubs).default
    return expect(main()).to.be.fulfilled.then((retcode) => {
      expect(retcode).to.equal(1)
      expect(logger.error).to.have.been.calledWith(
        'Project name not found in package.json. ' +
        'Use -p/--project to pass it explicitly')
    })
  })

  it('returns when no tags are found in repository', () => {
    git.getSemverTags.returns([])
    parseArguments.returns({logLevel: 'debug', user: 'user', project: 'project'})
    const main = requireInject('../src/main', stubs).default
    return expect(main()).to.be.fulfilled.then((retcode) => {
      expect(retcode).to.equal(1)
      expect(logger.error).to.have.been.calledWith('No tags found in repository')
    })
  })

  it('returns when tag is not semver compliant', () => {
    git.getSemverTags.returns(['a tag', 'another tag'])
    const tag = 'not a semver tag'
    parseArguments.returns({
      logLevel: 'debug',
      user: 'user',
      project: 'project',
      tag
    })
    const main = requireInject('../src/main', stubs).default
    return expect(main()).to.be.fulfilled.then((retcode) => {
      expect(retcode).to.equal(1)
      expect(logger.error).to.have.been.calledWith(
        'Tag not semver compliant: %s', tag)
    })
  })

  it('returns when tag is not found in repository', () => {
    git.getSemverTags.returns(['v1.0.0'])
    const tag = 'v0.1.0'
    parseArguments.returns({
      logLevel: 'debug',
      user: 'user',
      project: 'project',
      tag
    })
    const main = requireInject('../src/main', stubs).default
    return expect(main()).to.be.fulfilled.then((retcode) => {
      expect(retcode).to.equal(1)
      expect(logger.error).to.have.been.calledWith(
        'Tag not found in repository: %s', tag)
    })
  })

  it('logs number of comments written on success', () => {
    git.getSemverTags.returns(['v1.0.0'])
    git.getMergeCommits.returns(['a commit', 'another commit'])
    git.getPRs(['a PR', 'another PR'])
    parseArguments.returns({
      logLevel: 'debug',
      user: 'user',
      project: 'project',
      accessToken: 'token',
      tag: 'v1.0.0'
    })
    github.authorize.resolves('authorization data')
    const newComments = ['a new comment', null, 'another new comment']
    github.writeComments.resolves(newComments)
    const main = requireInject('../src/main', stubs).default
    return expect(main()).to.be.fulfilled.then((retcode) => {
      expect(retcode).to.equal(0)
      expect(logger.info).to.have.been.calledWith('%d comments written', 2)
      expect(logger.info).to.have.been.calledWith('Done!')
    })
  })

  it('writes unexpected error to log on failure', () => {
    git.getSemverTags.returns(['v1.0.0', 'v0.0.1'])
    git.getMergeCommits.returns(['a commit', 'another commit'])
    git.getPRs(['a PR', 'another PR'])
    parseArguments.returns({
      logLevel: 'debug',
      user: 'user',
      project: 'project',
      accessToken: 'token',
      tag: 'v1.0.0'
    })
    github.authorize.resolves('authorization data')
    const error = new Error('some error')
    github.writeComments.rejects(error)
    const main = requireInject('../src/main', stubs).default
    return expect(main()).to.be.fulfilled.then((retcode) => {
      expect(retcode).to.equal(1)
      expect(logger.error).to.have.been.calledWith(error)
    })
  })
})
