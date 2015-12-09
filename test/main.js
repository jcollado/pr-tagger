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
      getSemverTags: sinon.stub()
    }
    github = sinon.spy()
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

  it('returns when no tags are found in repository', function () {
    git.getSemverTags.returns([])
    parseArguments.returns({logLevel: 'debug'})
    const main = requireInject('../lib/main', stubs)
    expect(main()).to.equal(1)
    expect(logger.error).to.have.been.calledWith('No tags found in repository')
  })

  it('returns when tag is not semver compliant', function () {
    git.getSemverTags.returns(['a tag', 'another tag'])
    const tag = 'not a semver tag'
    parseArguments.returns({
      logLevel: 'debug',
      tag
    })
    const main = requireInject('../lib/main', stubs)
    expect(main()).to.equal(1)
    expect(logger.error).to.have.been.calledWith(
      'Tag not semver compliant: %s', tag)
  })
})
