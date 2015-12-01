/* global describe it beforeEach */
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

describe('writeComment', function () {
  let stubs
  let createComment
  let logger
  const pr = 42

  beforeEach('create stubs', function () {
    createComment = sinon.stub()
    logger = {
      debug: sinon.stub(),
      error: sinon.stub()
    }
    stubs = {
      ghissues: {
        createComment
      }
    }
    stubs[require.resolve('../lib/logging')] = {
      logger
    }
  })

  it('writes comment object to log on success', function () {
    createComment.callsArgWith(5, undefined, '<comment object>')
    const github = requireInject('../lib/github', stubs)

    github.writeComment('auth data', 'user', 'project', pr, 'comment')
    expect(logger.debug).to.have.been.calledWith('Comment: %s', '<comment object>')
  })

  it('writes error to log on failure', function () {
    const expectedError = new Error('some error')
    createComment.callsArgWith(5, expectedError, undefined)
    const github = requireInject('../lib/github', stubs)

    github.writeComment('auth data', 'user', 'project', pr, 'comment')
    expect(logger.error).to.have.been.calledWith(
      'Error adding comment to PR#%d: %s', pr, expectedError)
  })
})
