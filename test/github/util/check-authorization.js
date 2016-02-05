import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import requireInject from 'require-inject'
import sinon from 'sinon'
import test from 'ava'

chai.use(chaiAsPromised)
const expect = chai.expect

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

test('github.util.checkAuthorization: resolves if issues can be retrieved', (t) => {
  const {list, util} = t.context
  const authData = 'authorization data'
  list.yields()
  return expect(util.checkAuthorization(authData, 'program'))
    .to.eventually.equal(authData)
})

test("github.util.checkAuthorization: rejects if issues list can't be retrieved", (t) => {
  const {list, util} = t.context
  list.yields(new Error('some error'))
  return expect(util.checkAuthorization('authorization data', 'program'))
    .to.be.rejected
})
