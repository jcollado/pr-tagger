/* global describe it beforeEach afterEach */
'use strict'

const chai = require('chai')
const requireInject = require('require-inject')
const sinon = require('sinon')

const expect = chai.expect

describe('authorize', function () {
  let stubs
  const authOptions = {}

  beforeEach('create stubs', function () {
    stubs = {
      ghauth: null
    }
    stubs[require.resolve('../../lib/logging')] = {
      logger: {
        debug: sinon.spy(),
        error: sinon.spy()
      }
    }
    sinon.stub(process, 'exit')
  })

  afterEach('restore stubs', function () {
    process.exit.restore()
  })

  it('returns authorization data on success', function (done) {
    const expected = {user: 'some user', token: 'some token'}
    stubs.ghauth = function (options, cb) {
      cb(null, expected)
    }
    const github = requireInject('../../lib/github', stubs)

    github.authorize(authOptions).then(
      function (authData) {
        expect(authData).to.equal(expected)
        done()
      }
    )
  })

  it('exits on failure', function (done) {
    stubs.ghauth = function (options, cb) {
      cb(new Error(), null)
    }
    const github = requireInject('../../lib/github', stubs)

    github.authorize(authOptions).then(
      function () {
        expect(process.exit).to.have.been.calledWith(1)
        done()
      }
    )
  })
})

describe('writeComments', function () {
  let stubs
  let logger
  const authData = {}

  beforeEach('create stubs', function () {
    logger = {
      debug: sinon.spy(),
      info: sinon.spy(),
      error: sinon.spy()
    }
    stubs = {
      ghissues: {}
    }
    stubs[require.resolve('../../lib/logging')] = {
      logger
    }
    stubs[require.resolve('../../lib/github')] = {
      getSemverComments: sinon.stub().returns([])
    }
  })

  it('gets comments for each PR', function (done) {
    const listComments = sinon.spy()
    stubs.ghissues.listComments = function (
        authData, user, project, pr, cb) {
      listComments.apply(this, arguments)
      cb(null, ['some comment', 'another comment'])
    }
    const github = requireInject('../../lib/github', stubs)
    const program = {
      user: 'some user',
      project: 'some project',
      dryRun: true
    }
    const prs = [1, 2, 3, 4]
    const comment = 'some semver tag used as comment'

    github.writeComments(authData, program, prs, comment).then(
      function (commentList) {
        prs.forEach(function (pr) {
          expect(listComments).to.have.been.calledWith(
            authData, program.user, program.project, pr)
        })
        done()
      })
  })
})

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

  it('writes comment object to log on success', function (done) {
    const expected = '<comment object>'
    stubs.ghissues.createComment = function (
        authData, user, project, pr, comment, cb) {
      cb(null, expected)
    }
    const github = requireInject('../../lib/github', stubs)

    github.writeComment('auth data', 'user', 'project', pr, 'comment').then(
      function () {
        expect(logger.debug).to.have.been.calledWith('Comment: %s', expected)
        done()
      })
  })

  it('writes error to log on failure', function (done) {
    const expected = new Error('some error')
    stubs.ghissues.createComment = function (
        authData, user, project, pr, comment, cb) {
      cb(expected, null)
    }
    const github = requireInject('../../lib/github', stubs)

    github.writeComment('auth data', 'user', 'project', pr, 'comment').then(
      function () {
        expect(logger.error).to.have.been.calledWith(
          'Error adding comment to PR#%d: %s', pr, expected)
        done()
      })
  })
})

describe('getSemverComments', function () {
  const github = require('../../lib/github')

  it('filters semver comments', function () {
    const commentList = [
      {body: 'a comment'},
      {body: 'v0.0.0'},
      {body: 'another comment'}
    ]

    expect(github.getSemverComments(commentList))
      .to.deep.equal(['v0.0.0'])
  })

  it('returns empty array on no comments', function () {
    const commentList = []
    expect(github.getSemverComments(commentList))
      .to.deep.equal([])
  })
})
