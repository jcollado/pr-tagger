/* global describe it */
'use strict'

const chai = require('chai')
const requireInject = require('require-inject')
const sinon = require('sinon')

const expect = chai.expect

describe('getMergeCommits', function () {
  it('returns one commit per line', function () {
    let stubs = {}
    stubs[require.resolve('../lib/util')] = {
      exec: sinon.stub().returns(new Buffer('commit 1\ncommit 2\n'))
    }

    const github = requireInject('../lib/github', stubs)

    expect(github.getMergeCommits('a..b'))
      .to.deep.equal(['commit 1', 'commit 2'])
  })
})
