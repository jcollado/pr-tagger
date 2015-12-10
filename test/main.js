/* globals describe it beforeEach */
'use strict'

const chai = require('chai')
const requireInject = require('require-inject')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')

const expect = chai.expect
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
    github = {}
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

  it('returns when no tags are found in repository', function (done) {
    git.getSemverTags.returns([])
    parseArguments.returns({logLevel: 'debug'})
    const main = requireInject('../lib/main', stubs)
    main().then(function (retcode) {
      expect(retcode).to.equal(1)
      expect(logger.error).to.have.been.calledWith('No tags found in repository')
      done()
    })
  })

  it('returns when tag is not semver compliant', function () {
    git.getSemverTags.returns(['a tag', 'another tag'])
    const tag = 'not a semver tag'
    parseArguments.returns({
      logLevel: 'debug',
      tag
    })
    const main = requireInject('../lib/main', stubs)
    main().then(function (retcode) {
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
      tag
    })
    const main = requireInject('../lib/main', stubs)
    main().then(function (retcode) {
      expect(retcode).to.equal(1)
      expect(logger.error).to.have.been.calledWith(
        'Tag not found in repository: %s', tag)
    })
  })

  it('writes done to log on success', function (done) {
    git.getSemverTags.returns(['v1.0.0'])
    git.getMergeCommits.returns(['a commit', 'another commit'])
    git.getPRs(['a PR', 'another PR'])
    const tag = 'v1.0.0'
    parseArguments.returns({
      logLevel: 'debug',
      tag
    })
    github.authorize = function () {
      return Promise.resolve('authorization data')
    }
    github.writeComments = function () {
      return Promise.resolve('prs with comments')
    }
    logger.info = function (message) {
      if (message === 'Done!') {
        done()
      }
    }
    const main = requireInject('../lib/main', stubs)
    main().then(function (retcode) {
      expect(retcode).to.equal(0)
    })
  })

  it('writes unexpected error to log on failure', function (done) {
    git.getSemverTags.returns(['v1.0.0'])
    git.getMergeCommits.returns(['a commit', 'another commit'])
    git.getPRs(['a PR', 'another PR'])
    const tag = 'v1.0.0'
    parseArguments.returns({
      logLevel: 'debug',
      tag
    })
    github.authorize = function () {
      return Promise.resolve('authorization data')
    }
    const error = 'some error'
    github.writeComments = function () {
      return Promise.reject(error)
    }
    const main = requireInject('../lib/main', stubs)
    main().then(function (retcode) {
      expect(retcode).to.equal(1)
      expect(logger.error).to.have.been.calledWith(
        'Unexpected error: %s', error)
      done()
    })
  })
})
