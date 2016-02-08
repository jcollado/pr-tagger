import requireInject from 'require-inject'
import sinon from 'sinon'
import test from 'ava'

const authData = {}
const prs = [1, 2, 3, 4]
const comment = 'some semver tag used as comment'

test.beforeEach((t) => {
  const logger = {
    info: sinon.spy(),
    warn: sinon.spy(),
    error: sinon.spy()
  }
  const getSemverComments = sinon.stub()
  const writeComment = sinon.stub()
  const listComments = sinon.stub()
  const stubs = {
    ghissues: {
      listComments
    },
    [require.resolve('../../../src/logging')]: { logger },
    [require.resolve('../../../src/github/util')]: {
      getSemverComments,
      writeComment
    }
  }
  const github = requireInject('../../../src/github', stubs)

  const program = {
    user: 'some user',
    project: 'some project'
  }

  t.context = {
    getSemverComments,
    github,
    listComments,
    logger,
    program,
    writeComment
  }
})

test('github.writeComments: gets comments for each PR', async function (t) {
  const { getSemverComments, github, listComments, program } = t.context
  listComments.yields(null, ['some comment', 'another comment'])
  getSemverComments.returns([])

  program.dryRun = true
  await github.writeComments(authData, program, prs, comment)
  prs.forEach((pr) => {
    t.true(listComments.calledWith(
      authData, program.owner, program.project, pr))
  })
})

test('github.writeComments: logs errors when retrieving comments', async function (t) {
  const { github, listComments, logger, program } = t.context
  const error = 'some error'
  listComments.yields(error)

  program.dryRun = true
  const commentList = await github.writeComments(authData, program, prs, comment)
  commentList.forEach((comment) => {
    t.is(comment, null)
  })
  prs.forEach((pr) => {
    t.true(logger.error.calledWith(
      'Error checking PR#%d comments: %s', pr, error))
  })
})

test('github.writeComments: writes comments if dryRun is not set', async function (t) {
  const { getSemverComments, github, listComments, program, writeComment } = t.context
  listComments.yields(null, ['some comment', 'another comment'])
  getSemverComments.returns([])
  const expected = 'new comment'
  writeComment.returns(expected)

  program.dryRun = false
  const commentList = await github.writeComments(authData, program, prs, comment)
  commentList.forEach((comment) => {
    t.is(comment, expected)
  })
  prs.forEach((pr) => {
    t.true(writeComment.calledWith(
      authData, program.owner, program.project, pr, comment))
  })
})

test('github.writeComments: does not write comments if dryRun is set', async function (t) {
  const { getSemverComments, github, listComments, program, writeComment } = t.context
  listComments.yields(null, ['some comment', 'another comment'])
  getSemverComments.returns([])

  program.dryRun = true
  const commentList = await github.writeComments(authData, program, prs, comment)
  commentList.forEach((comment) => {
    t.is(comment, null)
  })
  t.false(writeComment.called)
})

test('github.writeComments: does not write comments if semver comments are found', async function (t) {
  const { getSemverComments, github, listComments, logger, program, writeComment } = t.context
  listComments.yields(null, ['some comment', 'another comment'])
  const semverComments = ['some semver comment']
  getSemverComments.returns(semverComments)

  program.dryRun = false
  const commentList = await github.writeComments(authData, program, prs, comment)
  commentList.forEach((comment) => {
    t.is(comment, null)
  })
  prs.forEach((pr) => {
    t.true(logger.warn.calledWith(
      'Semver comments found in PR#%d: %s',
      pr, JSON.stringify(semverComments)))
  })
  t.false(writeComment.called)
})
