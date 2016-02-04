/* global describe it beforeEach */
'use strict'

const chai = require('chai')
const requireInject = require('require-inject')
const sinon = require('sinon')

const expect = chai.expect

function stubExec (stubs, exec) {
  return function () {
    exec.reset()
    stubs[require.resolve('../src/util')] = { exec }
  }
}

describe('git.getSemverTags', function () {
  let stubs = {}
  let exec = sinon.stub()

  beforeEach('create stubs', stubExec(stubs, exec))

  it('returns semver tags only in an array', function () {
    exec.returns(new Buffer('v0.1.0\nnot-semver\nv0.2.0\nv0.2.1\nv1.0.0\n'))
    const git = requireInject('../src/git', stubs)

    const tags = git.getSemverTags()
    expect(tags).to.deep.equal(['v1.0.0', 'v0.2.1', 'v0.2.0', 'v0.1.0'])
  })

  it('returns empty array when no tags found', function () {
    exec.returns(new Buffer('not-semver\n'))
    const git = requireInject('../src/git', stubs)

    const tags = git.getSemverTags()
    expect(tags).to.deep.equal([])
  })
})

describe('git.getMergeCommits', function () {
  let stubs = {}
  let exec = sinon.stub()

  beforeEach('create stubs', stubExec(stubs, exec))

  it('returns one commit per line', function () {
    exec.returns(new Buffer('commit 1\ncommit 2\n'))
    const git = requireInject('../src/git', stubs)

    expect(git.getMergeCommits('a..b'))
      .to.deep.equal(['commit 1', 'commit 2'])
  })

  it('returns empty array when no commits are found', function () {
    exec.returns(new Buffer(''))
    const git = requireInject('../src/git', stubs)

    expect(git.getMergeCommits('a..b')).to.deep.equal([])
  })
})

describe('git.getPRs', function () {
  const getPRs = require('../src/git').getPRs

  it('filters commits with PRs', function () {
    const prs = getPRs([
      'this is a commit',
      'Merge pull request #42 from ',
      'Merge pull request #7 from ',
      'this is another commit'
    ])
    expect(prs).to.deep.equal([42, 7])
  })

  it('return empty array when no commits have been passed', function () {
    const prs = getPRs([])
    expect(prs).to.deep.equal([])
  })
})
