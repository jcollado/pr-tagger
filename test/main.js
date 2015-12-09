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
    parseArguments = sinon.stub().returns({
      logLevel: 'debug'
    })
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

  it('exits when no tags are found in repository', function () {
    git.getSemverTags.returns([])
    const main = requireInject('../lib/main', stubs)
    expect(main()).to.equal(1)
    expect(logger.error).to.have.been.calledWith('No tags found in repository')
  })
})
