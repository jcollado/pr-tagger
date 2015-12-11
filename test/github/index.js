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
  let getSemverComments
  let writeComment

  const authData = {}
  let program
  const prs = [1, 2, 3, 4]
  const comment = 'some semver tag used as comment'

  beforeEach('create stubs', function () {
    logger = {
      info: sinon.spy(),
      warn: sinon.spy(),
      error: sinon.spy()
    }
    getSemverComments = sinon.stub()
    writeComment = sinon.stub()
    stubs = {
      ghissues: {}
    }
    stubs[require.resolve('../../lib/logging')] = {
      logger
    }
    stubs[require.resolve('../../lib/github/util')] = {
      getSemverComments,
      writeComment
    }

    program = {
      user: 'some user',
      project: 'some project'
    }
  })

  it('gets comments for each PR', function (done) {
    const listComments = sinon.spy()
    getSemverComments.returns([])
    stubs.ghissues.listComments = function (
        authData, user, project, pr, cb) {
      listComments.apply(this, arguments)
      cb(null, ['some comment', 'another comment'])
    }
    const github = requireInject('../../lib/github', stubs)

    program.dryRun = true
    github.writeComments(authData, program, prs, comment).then(
      function (commentList) {
        prs.forEach(function (pr) {
          expect(listComments).to.have.been.calledWith(
            authData, program.user, program.project, pr)
        })
        done()
      })
  })

  it('logs errors when retrieving comments', function (done) {
    const error = 'some error'
    stubs.ghissues.listComments = function (
        authData, user, project, pr, cb) {
      cb(error, null)
    }
    const github = requireInject('../../lib/github', stubs)

    program.dryRun = true
    github.writeComments(authData, program, prs, comment).then(
      function (commentList) {
        commentList.forEach(function (comment) {
          expect(comment).to.be.null
        })
        prs.forEach(function (pr) {
          expect(logger.error).to.have.been.calledWith(
            'Error checking PR#%d comments: %s', pr, error)
        })
        done()
      })
  })

  it('writes comments if dryRun is not set', function (done) {
    getSemverComments.returns([])
    stubs.ghissues.listComments = function (
        authData, user, project, pr, cb) {
      cb(null, ['some comment', 'another comment'])
    }
    const expected = 'new comment'
    writeComment.returns(expected)
    const github = requireInject('../../lib/github', stubs)

    program.dryRun = false
    github.writeComments(authData, program, prs, comment).then(
      function (commentList) {
        commentList.forEach(function (comment) {
          expect(comment).to.equal(expected)
        })
        prs.forEach(function (pr) {
          expect(writeComment).to.have.been.calledWith(
            authData, program.user, program.project, pr, comment)
        })
        done()
      })
  })

  it('does not write comments if dryRun is set', function (done) {
    getSemverComments.returns([])
    stubs.ghissues.listComments = function (
        authData, user, project, pr, cb) {
      cb(null, ['some comment', 'another comment'])
    }
    const github = requireInject('../../lib/github', stubs)

    program.dryRun = true
    github.writeComments(authData, program, prs, comment).then(
      function (commentList) {
        commentList.forEach(function (comment) {
          expect(comment).to.be.null
        })
        expect(writeComment).to.not.have.been.called
        done()
      })
  })

  it('does not write comments if semver comments are found', function (done) {
    const semverComments = ['some semver comment']
    getSemverComments.returns(semverComments)
    stubs.ghissues.listComments = function (
        authData, user, project, pr, cb) {
      cb(null, ['some comment', 'another comment'])
    }
    const github = requireInject('../../lib/github', stubs)

    program.dryRun = false
    github.writeComments(authData, program, prs, comment).then(
      function (commentList) {
        commentList.forEach(function (comment) {
          expect(comment).to.be.null
        })
        prs.forEach(function (pr) {
          expect(logger.warn).to.have.been.calledWith(
            'Semver comments found in PR#%d: %s',
            pr, JSON.stringify(semverComments))
        })
        expect(writeComment).to.not.have.been.called
        done()
      })
  })
})
