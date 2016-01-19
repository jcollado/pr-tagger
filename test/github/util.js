/* global describe it beforeEach */
'use strict'

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const requireInject = require('require-inject')
const sinon = require('sinon')

chai.use(chaiAsPromised)
const expect = chai.expect

describe('github.util.writeComment', function () {
  let createComment
  let stubs
  let logger
  const pr = 42

  beforeEach('create stubs', function () {
    logger = {
      debug: sinon.spy(),
      error: sinon.spy()
    }
    createComment = sinon.stub()
    stubs = {
      ghissues: {
        createComment
      }
    }
    stubs[require.resolve('../../lib/logging')] = {
      logger
    }
  })

  it('writes comment object to log on success', function () {
    const expected = '<comment object>'
    createComment.yields(null, expected)
    const util = requireInject('../../lib/github/util', stubs)

    return expect(util.writeComment('auth data', 'user', 'project', pr, 'comment'))
      .to.be.fulfilled.then(function () {
        expect(logger.debug).to.have.been.calledWith(
          'Comment added to PR#%d: %s', pr, JSON.stringify(expected))
      })
  })

  it('writes error to log on failure', function () {
    const expected = new Error('some error')
    createComment.yields(expected)
    const util = requireInject('../../lib/github/util', stubs)

    return expect(util.writeComment('auth data', 'user', 'project', pr, 'comment'))
      .to.be.fulfilled.then(function () {
        expect(logger.error).to.have.been.calledWith(
          'Error adding comment to PR#%d: %s', pr, expected)
      })
  })
})

describe('github.util.getSemverComments', function () {
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

describe('github.util.checkAuthorization', function () {
  let list
  let stubs

  beforeEach(function () {
    list = sinon.stub()
    stubs = {
      ghissues: {
        list
      }
    }
  })

  it('resolves if issues can be retrieved', function () {
    const authData = 'authorization data'
    list.yields()
    const util = requireInject('../../lib/github/util', stubs)
    return expect(util.checkAuthorization(authData, 'program'))
      .to.eventually.equal(authData)
  })

  it("rejects if issues list can't be retrieved", function () {
    list.yields(new Error('some error'))
    const util = requireInject('../../lib/github/util', stubs)
    return expect(util.checkAuthorization('authorization data', 'program'))
      .to.be.rejected
  })
})
