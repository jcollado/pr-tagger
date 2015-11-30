/* global describe it beforeEach */
'use strict'

const chai = require('chai')
const requireInject = require('require-inject')
const sinon = require('sinon')

const expect = chai.expect

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
