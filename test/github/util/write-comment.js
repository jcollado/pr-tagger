import requireInject from 'require-inject'
import sinon from 'sinon'
import test from 'ava'

const pr = 42

test.beforeEach('create stubs', (t) => {
  const logger = {
    debug: sinon.spy(),
    error: sinon.spy()
  }
  const createComment = sinon.stub()
  const stubs = {
    ghissues: {
      createComment,
      list: sinon.spy()
    },
    [require.resolve('../../../src/logging')]: { logger }
  }
  const util = requireInject('../../../src/github/util', stubs)
  t.context = { createComment, logger, util }
})

test('github.util.writeComment: writes comment object to log on success', async function (t) {
  const { createComment, logger, util } = t.context
  const expected = {html_url: '<some url>'}
  createComment.yields(null, expected, '<response>')

  await util.writeComment('auth data', 'user', 'project', pr, 'body')
  t.true(logger.debug.calledWith(
    'Comment added to PR#%d: %s', pr, expected.html_url))
})

test('github.util.writeComment: writes error to log on failure', async function (t) {
  const { createComment, logger, util } = t.context
  const expected = new Error('some error')
  createComment.yields(expected)

  await util.writeComment('auth data', 'user', 'project', pr, 'comment')
  t.true(logger.error.calledWith(
    'Error adding comment to PR#%d: %s', pr, expected))
})
