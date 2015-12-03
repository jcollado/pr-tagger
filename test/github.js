/* global describe it beforeEach afterEach */
'use strict'

const chai = require('chai')
const requireInject = require('require-inject')
const sinon = require('sinon')

const expect = chai.expect

describe('getSemverTags', function () {
  let stubs
  let exec

  beforeEach('create stubs', function () {
    exec = sinon.stub()
    stubs = {}
    stubs[require.resolve('../lib/util')] = { exec }
  })

  it('returns semver tags only in an array', function () {
    exec.returns(new Buffer('v1.0.0\nnot-semver\nv0.2.1\nv0.2.0\nv0.1.0\n'))
    const github = requireInject('../lib/github', stubs)

    const tags = github.getSemverTags()
    expect(tags).to.deep.equal(['v1.0.0', 'v0.2.1', 'v0.2.0', 'v0.1.0'])
  })

  it('returns empty array when no tags found', function () {
    exec.returns(new Buffer('not-semver\n'))
    const github = requireInject('../lib/github', stubs)

    const tags = github.getSemverTags()
    expect(tags).to.deep.equal([])
  })
})

describe('getMergeCommits', function () {
  let stubs
  let exec

  beforeEach('create stubs', function () {
    exec = sinon.stub()
    stubs = {}
    stubs[require.resolve('../lib/util')] = { exec }
  })

  it('returns one commit per line', function () {
    exec.returns(new Buffer('commit 1\ncommit 2\n'))
    const github = requireInject('../lib/github', stubs)

    expect(github.getMergeCommits('a..b'))
      .to.deep.equal(['commit 1', 'commit 2'])
  })

  it('returns empty array when no commits are found', function () {
    exec.returns(new Buffer(''))
    const github = requireInject('../lib/github', stubs)

    expect(github.getMergeCommits('a..b')).to.deep.equal([])
  })
})

describe('getPRs', function () {
  const getPRs = require('../lib/github').getPRs

  it('filters commits with PRs', function () {
    const prs = getPRs([
      'this is a commit',
      'Merge pull request #42 from ',
      'this is another commit'
    ])
    expect(prs).to.deep.equal([42])
  })

  it('return empty array when no commits have been passed', function () {
    const prs = getPRs([])
    expect(prs).to.deep.equal([])
  })
})

describe('authorize', function () {
  let stubs
  const authOptions = {}

  beforeEach('create stubs', function () {
    stubs = {
      ghauth: null
    }
    stubs[require.resolve('../lib/logging')] = {
      logger: {
        debug: sinon.stub(),
        error: sinon.stub()
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
    const github = requireInject('../lib/github', stubs)

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
    const github = requireInject('../lib/github', stubs)

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
      debug: sinon.stub(),
      info: sinon.stub(),
      error: sinon.stub()
    }
    stubs = {
      ghissues: {}
    }
    stubs[require.resolve('../lib/logging')] = {
      logger
    }
    stubs[require.resolve('../lib/github')] = {
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
    const github = requireInject('../lib/github', stubs)
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
      debug: sinon.stub(),
      error: sinon.stub()
    }
    stubs = {
      ghissues: {}
    }
    stubs[require.resolve('../lib/logging')] = {
      logger
    }
  })

  it('writes comment object to log on success', function (done) {
    const expected = '<comment object>'
    stubs.ghissues.createComment = function (
        authData, user, project, pr, comment, cb) {
      cb(null, expected)
    }
    const github = requireInject('../lib/github', stubs)

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
    const github = requireInject('../lib/github', stubs)

    github.writeComment('auth data', 'user', 'project', pr, 'comment').then(
      function () {
        expect(logger.error).to.have.been.calledWith(
          'Error adding comment to PR#%d: %s', pr, expected)
        done()
      })
  })
})

describe('getSemverComments', function () {
  const github = require('../lib/github')

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
