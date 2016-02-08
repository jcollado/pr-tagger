import requireInject from 'require-inject'
import sinon from 'sinon'
import test from 'ava'

test.beforeEach((t) => {
  const list = sinon.stub()
  const stubs = {
    ghissues: {
      createComment: sinon.spy(),
      list
    }
  }
  const util = requireInject('../../../src/github/util', stubs)

  t.context = { list, util }
})

test('github.util.checkAuthorization: resolves if issues can be retrieved', async function (t) {
  const {list, util} = t.context
  const expected = 'authorization data'
  list.yields()
  const authData = await util.checkAuthorization(expected, 'program')
  t.is(authData, expected)
})

test("github.util.checkAuthorization: rejects if issues list can't be retrieved", (t) => {
  const {list, util} = t.context
  list.yields(new Error('some error'))
  return t.throws(util.checkAuthorization('authorization data', 'program'))
})
