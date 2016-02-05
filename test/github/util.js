/* global describe it beforeEach */
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import requireInject from 'require-inject'
import sinon from 'sinon'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('github.util.writeComment', () => {
  let createComment
  let stubs
  let logger
  const pr = 42

  beforeEach('create stubs', () => {
    logger = {
      debug: sinon.spy(),
      error: sinon.spy()
    }
    createComment = sinon.stub()
    stubs = {
      ghissues: {
        createComment,
        list: sinon.spy()
      }
    }
    stubs[require.resolve('../../src/logging')] = {
      logger
    }
  })

  it('writes comment object to log on success', () => {
    const expected = {html_url: '<some url>'}
    createComment.yields(null, expected, '<response>')
    const util = requireInject('../../src/github/util', stubs)

    return expect(util.writeComment('auth data', 'user', 'project', pr, 'body'))
      .to.be.fulfilled.then(() => {
        expect(logger.debug).to.have.been.calledWith(
          'Comment added to PR#%d: %s', pr, expected.html_url)
      })
  })

  it('writes error to log on failure', () => {
    const expected = new Error('some error')
    createComment.yields(expected)
    const util = requireInject('../../src/github/util', stubs)

    return expect(util.writeComment('auth data', 'user', 'project', pr, 'comment'))
      .to.be.fulfilled.then(() => {
        expect(logger.error).to.have.been.calledWith(
          'Error adding comment to PR#%d: %s', pr, expected)
      })
  })
})

describe('github.util.getSemverComments', () => {
  const util = require('../../src/github/util')

  it('filters semver comments', () => {
    const commentList = [
      {body: 'a comment'},
      {body: 'v0.0.0'},
      {body: 'v0.1.0'},
      {body: 'another comment'},
      {body: 'semver v0.2.0 embedded in a comment'},
      {body: 'Released in: [v0.3.0](https://github.com/user/project/releases/tag/v0.3.0)'}
    ]

    expect(util.getSemverComments(commentList))
      .to.deep.equal([
        'v0.0.0',
        'v0.1.0',
        'semver v0.2.0 embedded in a comment',
        'Released in: [v0.3.0](https://github.com/user/project/releases/tag/v0.3.0)'
      ])
  })

  it('returns empty array on no comments', () => {
    const commentList = []
    expect(util.getSemverComments(commentList))
      .to.deep.equal([])
  })
})

describe('github.util.checkAuthorization', () => {
  let list
  let stubs

  beforeEach(() => {
    list = sinon.stub()
    stubs = {
      ghissues: {
        createComment: sinon.spy(),
        list
      }
    }
  })

  it('resolves if issues can be retrieved', () => {
    const authData = 'authorization data'
    list.yields()
    const util = requireInject('../../src/github/util', stubs)
    return expect(util.checkAuthorization(authData, 'program'))
      .to.eventually.equal(authData)
  })

  it("rejects if issues list can't be retrieved", () => {
    list.yields(new Error('some error'))
    const util = requireInject('../../src/github/util', stubs)
    return expect(util.checkAuthorization('authorization data', 'program'))
      .to.be.rejected
  })
})
