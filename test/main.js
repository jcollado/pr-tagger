/* globals describe it beforeEach */
'use strict'

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const requireInject = require('require-inject')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')
require('sinon-as-promised')

const expect = chai.expect
chai.use(chaiAsPromised)
chai.use(sinonChai)

describe('main', function () {
  let stubs
  let getUrl
  let git
  let github
  let logger
  let parseArguments

  beforeEach('create stubs', function () {
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
    stubs = {}
    stubs[require.resolve('../lib/arguments')] = {
      parseArguments
    }
    stubs[require.resolve('../lib/git')] = git
    stubs[require.resolve('../lib/github')] = github
    stubs[require.resolve('../lib/logging')] = {
      logger
    }
    stubs[require.resolve('../lib/util')] = {
      getUrl
    }
  })

  it('returns when user name is not found', function () {
    git.getSemverTags.returns(['a tag', 'another tag'])
    parseArguments.returns({logLevel: 'debug'})
    const main = requireInject('../lib/main', stubs)
    return expect(main()).to.be.fulfilled.then(function (retcode) {
      expect(retcode).to.equal(1)
      expect(logger.error).to.have.been.calledWith(
        'User name not found in package.json. ' +
        'Use -u/--user to pass it explicitly.')
    })
  })

  it('returns when project name is not found', function () {
    git.getSemverTags.returns(['a tag', 'another tag'])
    parseArguments.returns({logLevel: 'debug', user: 'user'})
    const main = requireInject('../lib/main', stubs)
    return expect(main()).to.be.fulfilled.then(function (retcode) {
      expect(retcode).to.equal(1)
      expect(logger.error).to.have.been.calledWith(
        'Project name not found in package.json. ' +
        'Use -p/--project to pass it explicitly')
    })
  })

  it('returns when no tags are found in repository', function () {
    git.getSemverTags.returns([])
    parseArguments.returns({logLevel: 'debug', user: 'user', project: 'project'})
    const main = requireInject('../lib/main', stubs)
    return expect(main()).to.be.fulfilled.then(function (retcode) {
      expect(retcode).to.equal(1)
      expect(logger.error).to.have.been.calledWith('No tags found in repository')
    })
  })

  it('returns when tag is not semver compliant', function () {
    git.getSemverTags.returns(['a tag', 'another tag'])
    const tag = 'not a semver tag'
    parseArguments.returns({
      logLevel: 'debug',
      user: 'user',
      project: 'project',
      tag
    })
    const main = requireInject('../lib/main', stubs)
    return expect(main()).to.be.fulfilled.then(function (retcode) {
      expect(retcode).to.equal(1)
      expect(logger.error).to.have.been.calledWith(
        'Tag not semver compliant: %s', tag)
    })
  })

  it('returns when tag is not found in repository', function () {
    git.getSemverTags.returns(['v1.0.0'])
    const tag = 'v0.1.0'
    parseArguments.returns({
      logLevel: 'debug',
      user: 'user',
      project: 'project',
      tag
    })
    const main = requireInject('../lib/main', stubs)
    return expect(main()).to.be.fulfilled.then(function (retcode) {
      expect(retcode).to.equal(1)
      expect(logger.error).to.have.been.calledWith(
        'Tag not found in repository: %s', tag)
    })
  })

  it('uses access token from command line if passed', function () {
    git.getSemverTags.returns(['v1.0.0'])
    git.getMergeCommits.returns(['a commit', 'another commit'])
    git.getPRs(['a PR', 'another PR'])
    const tag = 'v1.0.0'
    parseArguments.returns({
      logLevel: 'debug',
      user: 'user',
      project: 'project',
      accessToken: 'token',
      tag
    })
    github.authorize.rejects()
    const newComments = ['a new comment', null, 'another new comment']
    github.writeComments.resolves(newComments)
    const main = requireInject('../lib/main', stubs)
    return expect(main()).to.be.fulfilled.then(function (retcode) {
      expect(retcode).to.equal(0)
      expect(logger.info).to.have.been.calledWith('%d comments written', 2)
      expect(logger.info).to.have.been.calledWith('Done!')
    })
  })

  it('logs number of comments written on success', function () {
    git.getSemverTags.returns(['v1.0.0'])
    git.getMergeCommits.returns(['a commit', 'another commit'])
    git.getPRs(['a PR', 'another PR'])
    const tag = 'v1.0.0'
    parseArguments.returns({
      logLevel: 'debug',
      user: 'user',
      project: 'project',
      tag
    })
    github.authorize.resolves('authorization data')
    const newComments = ['a new comment', null, 'another new comment']
    github.writeComments.resolves(newComments)
    const main = requireInject('../lib/main', stubs)
    return expect(main()).to.be.fulfilled.then(function (retcode) {
      expect(retcode).to.equal(0)
      expect(logger.info).to.have.been.calledWith('%d comments written', 2)
      expect(logger.info).to.have.been.calledWith('Done!')
    })
  })

  it('writes unexpected error to log on failure', function () {
    git.getSemverTags.returns(['v1.0.0', 'v0.0.1'])
    git.getMergeCommits.returns(['a commit', 'another commit'])
    git.getPRs(['a PR', 'another PR'])
    const tag = 'v1.0.0'
    parseArguments.returns({
      logLevel: 'debug',
      user: 'user',
      project: 'project',
      tag
    })
    github.authorize.resolves('authorization data')
    const error = new Error('some error')
    github.writeComments.rejects(error)
    const main = requireInject('../lib/main', stubs)
    return expect(main()).to.be.fulfilled.then(function (retcode) {
      expect(retcode).to.equal(1)
      expect(logger.error).to.have.been.calledWith(error)
    })
  })
})
