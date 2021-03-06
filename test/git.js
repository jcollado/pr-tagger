import requireInject from 'require-inject'
import sinon from 'sinon'
import test from 'ava'

test.beforeEach('git.getSemverTags', (t) => {
  const exec = sinon.stub()
  const stubs = {
    [require.resolve('../src/util')]: { exec }
  }
  const git = requireInject('../src/git', stubs)
  t.context = { exec, git }
})

test('git.getSemverTags: returns semver tags only in an array', (t) => {
  const { exec, git } = t.context
  exec.returns(new Buffer('v0.1.0\nnot-semver\nv0.2.0\nv0.2.1\nv1.0.0\n'))

  const tags = git.getSemverTags()
  t.same(tags, ['v1.0.0', 'v0.2.1', 'v0.2.0', 'v0.1.0'])
})

test('git.getSemverTags: returns empty array when no tags found', (t) => {
  const { exec, git } = t.context
  exec.returns(new Buffer('not-semver\n'))

  const tags = git.getSemverTags()
  t.same(tags, [])
})

test('git.getMergeCommits: returns one commit per line', (t) => {
  const { exec, git } = t.context
  exec.returns(new Buffer('commit 1\ncommit 2\n'))

  t.same(git.getMergeCommits('a..b'), ['commit 1', 'commit 2'])
})

test('git.getMergeCommits: returns empty array when no commits are found', (t) => {
  const { exec, git } = t.context
  exec.returns(new Buffer(''))

  t.same(git.getMergeCommits('a..b'), [])
})

test('git.getPRs: filters commits with PRs', (t) => {
  const { git } = t.context
  const prs = git.getPRs([
    'this is a commit',
    'Merge pull request #42 from ',
    'Merge pull request #7 from ',
    'this is another commit'
  ])
  t.same(prs, [42, 7])
})

test('git.getPRs: return empty array when no commits have been passed', (t) => {
  const { git } = t.context
  const prs = git.getPRs([])
  t.same(prs, [])
})
