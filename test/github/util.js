/* global describe it beforeEach */
'use strict'

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const requireInject = require('require-inject')
const sinon = require('sinon')

chai.use(chaiAsPromised)
const expect = chai.expect

describe('writeComment', function () {
  let stubs
  let logger
  const pr = 42

  beforeEach('create stubs', function () {
    logger = {
      debug: sinon.spy(),
      error: sinon.spy()
    }
    stubs = {
      ghissues: {}
    }
    stubs[require.resolve('../../lib/logging')] = {
      logger
    }
  })

  it('writes comment object to log on success', function () {
    const expected = '<comment object>'
    stubs.ghissues.createComment = function (
        authData, user, project, pr, comment, cb) {
      cb(null, expected)
    }
    const util = requireInject('../../lib/github/util', stubs)

    return expect(util.writeComment('auth data', 'user', 'project', pr, 'comment'))
      .to.be.fulfilled.then(function () {
        expect(logger.debug).to.have.been.calledWith(
          'Comment added to PR#%d: %s', pr, JSON.stringify(expected))
      })
  })

  it('writes error to log on failure', function () {
    const expected = new Error('some error')
    stubs.ghissues.createComment = function (
        authData, user, project, pr, comment, cb) {
      cb(expected, null)
    }
    const util = requireInject('../../lib/github/util', stubs)

    return expect(util.writeComment('auth data', 'user', 'project', pr, 'comment'))
      .to.be.fulfilled.then(function () {
        expect(logger.error).to.have.been.calledWith(
          'Error adding comment to PR#%d: %s', pr, expected)
      })
  })
})

describe('getSemverComments', function () {
  const util = require('../../lib/github/util')

  it('filters semver comments', function () {
    const commentList = [
      {body: 'a comment'},
      {body: 'v0.0.0'},
      {body: 'v0.1.0'},
      {body: 'another comment'}
    ]

    expect(util.getSemverComments(commentList))
      .to.deep.equal(['v0.0.0', 'v0.1.0'])
  })

  it('returns empty array on no comments', function () {
    const commentList = []
    expect(util.getSemverComments(commentList))
      .to.deep.equal([])
  })
})
