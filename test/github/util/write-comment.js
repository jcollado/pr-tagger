import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import requireInject from 'require-inject'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import test from 'ava'

chai.use(chaiAsPromised)
chai.use(sinonChai)
const expect = chai.expect

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

test('github.util.writeComment: writes comment object to log on success', (t) => {
  const { createComment, logger, util } = t.context
  const expected = {html_url: '<some url>'}
  createComment.yields(null, expected, '<response>')

  return expect(util.writeComment('auth data', 'user', 'project', pr, 'body'))
    .to.be.fulfilled.then(() => {
      expect(logger.debug).to.have.been.calledWith(
        'Comment added to PR#%d: %s', pr, expected.html_url)
    })
})

test('github.util.writeComment: writes error to log on failure', (t) => {
  const { createComment, logger, util } = t.context
  const expected = new Error('some error')
  createComment.yields(expected)

  return expect(util.writeComment('auth data', 'user', 'project', pr, 'comment'))
    .to.be.fulfilled.then(() => {
      expect(logger.error).to.have.been.calledWith(
        'Error adding comment to PR#%d: %s', pr, expected)
    })
})
