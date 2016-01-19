/* global describe it beforeEach */
'use strict'

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const requireInject = require('require-inject')
const sinon = require('sinon')

chai.use(chaiAsPromised)
const expect = chai.expect

describe('authorize', function () {
  let stubs
  const authOptions = {}
  const program = {
    name: 'a name',
    user: 'a user',
    project: 'a project'
  }

  beforeEach('create stubs', function () {
    stubs = {
      'application-config': sinon.stub().returns({filePath: 'a path'}),
      ghauth: null,
      ghissues: {}
    }
    stubs[require.resolve('../../lib/logging')] = {
      logger: {
        debug: sinon.spy(),
        error: sinon.spy()
      }
    }
  })

  it('returns authorization data on success', function () {
    const expected = {user: 'some user', token: 'some token'}
    stubs.ghauth = sinon.stub().yields(null, expected)
    stubs.ghissues.list = sinon.stub().yields(null, ['an issue', 'another issue'])
    const github = requireInject('../../lib/github', stubs)

    return expect(github.authorize(authOptions, program)).to.be.fulfilled.then(
      function (authData, user) {
        expect(authData).to.equal(expected)
      }
    )
  })

  it('rejects on general failure', function () {
    const message = 'some error'
    stubs.ghauth = sinon.stub().yields(new Error(message))
    const github = requireInject('../../lib/github', stubs)

    return expect(github.authorize(authOptions, program)).to.be.rejected.then(
      function (error) {
        expect(error).to.equal('GitHub Authorization failure: Error: some error')
      }
    )
  })

  it('rejects on bad credentials failure', function () {
    stubs.ghauth = sinon.stub().yields(new Error('Bad credentials'))
    const github = requireInject('../../lib/github', stubs)

    return expect(github.authorize(authOptions, program)).to.be.rejected.then(
      function (error) {
        expect(error).to.have.string('To troubleshoot the problem')
      }
    )
  })
})

describe('writeComments', function () {
  let stubs
  let logger
  let getSemverComments
  let listComments
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
    listComments = sinon.stub()
    stubs = {
      ghissues: {
        listComments
      }
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

  it('gets comments for each PR', function () {
    listComments.yields(null, ['some comment', 'another comment'])
    getSemverComments.returns([])
    const github = requireInject('../../lib/github', stubs)

    program.dryRun = true
    return expect(github.writeComments(authData, program, prs, comment))
      .to.be.fulfilled.then(function (commentList) {
        prs.forEach(function (pr) {
          expect(listComments).to.have.been.calledWith(
            authData, program.owner, program.project, pr)
        })
      })
  })

  it('logs errors when retrieving comments', function () {
    const error = 'some error'
    listComments.yields(error)
    const github = requireInject('../../lib/github', stubs)

    program.dryRun = true
    return expect(github.writeComments(authData, program, prs, comment))
      .to.be.fulfilled.then(function (commentList) {
        commentList.forEach(function (comment) {
          expect(comment).to.be.null
        })
        prs.forEach(function (pr) {
          expect(logger.error).to.have.been.calledWith(
            'Error checking PR#%d comments: %s', pr, error)
        })
      })
  })

  it('writes comments if dryRun is not set', function () {
    listComments.yields(null, ['some comment', 'another comment'])
    getSemverComments.returns([])
    const expected = 'new comment'
    writeComment.returns(expected)
    const github = requireInject('../../lib/github', stubs)

    program.dryRun = false
    return expect(github.writeComments(authData, program, prs, comment))
      .to.be.fulfilled.then(function (commentList) {
        commentList.forEach(function (comment) {
          expect(comment).to.equal(expected)
        })
        prs.forEach(function (pr) {
          expect(writeComment).to.have.been.calledWith(
            authData, program.owner, program.project, pr, comment)
        })
      })
  })

  it('does not write comments if dryRun is set', function () {
    listComments.yields(null, ['some comment', 'another comment'])
    getSemverComments.returns([])
    const github = requireInject('../../lib/github', stubs)

    program.dryRun = true
    return expect(github.writeComments(authData, program, prs, comment))
      .to.be.fulfilled.then(function (commentList) {
        commentList.forEach(function (comment) {
          expect(comment).to.be.null
        })
        expect(writeComment).to.not.have.been.called
      })
  })

  it('does not write comments if semver comments are found', function () {
    listComments.yields(null, ['some comment', 'another comment'])
    const semverComments = ['some semver comment']
    getSemverComments.returns(semverComments)
    const github = requireInject('../../lib/github', stubs)

    program.dryRun = false
    return expect(github.writeComments(authData, program, prs, comment))
      .to.be.fulfilled.then(function (commentList) {
        commentList.forEach(function (comment) {
          expect(comment).to.be.null
        })
        prs.forEach(function (pr) {
          expect(logger.warn).to.have.been.calledWith(
            'Semver comments found in PR#%d: %s',
            pr, JSON.stringify(semverComments))
        })
        expect(writeComment).to.not.have.been.called
      })
  })
})
