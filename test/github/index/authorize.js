import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import requireInject from 'require-inject'
import sinon from 'sinon'
import 'sinon-as-promised'
import test from 'ava'

chai.use(chaiAsPromised)
const expect = chai.expect

test.beforeEach('create stubs', (t) => {
  const ghauth = sinon.stub()
  const checkAuthorization = sinon.stub()
  const stubs = {
    'application-config': sinon.stub().returns({filePath: 'a path'}),
    ghauth,
    [require.resolve('../../../src/logging')]: {
      logger: {
        debug: sinon.spy(),
        error: sinon.spy()
      }
    },
    [require.resolve('../../../src/github/util')]: { checkAuthorization }
  }
  const github = requireInject('../../../src/github', stubs)
  const program = {
    name: 'a name',
    user: 'a user',
    project: 'a project'
  }
  t.context = { checkAuthorization, ghauth, github, program }
})

test('github.authorize: uses token from command line if available', (t) => {
  const { checkAuthorization, ghauth, github, program } = t.context
  const expected = {user: 'some user', token: 'some token'}
  program.accessToken = 'some token'
  checkAuthorization.resolves(expected)

  return expect(github.authorize(program)).to.be.fulfilled.then(
    (authData) => {
      expect(ghauth).to.not.have.been.called
    })
})

test('github.authorize: uses token from configuration file by default', (t) => {
  const { checkAuthorization, ghauth, github, program } = t.context
  ghauth.yields()
  checkAuthorization.resolves()

  return expect(github.authorize(program)).to.be.fulfilled.then(
    (authData) => {
      expect(ghauth).to.have.been.called
    })
})

test('github.authorize: resolves to authorization data on success', (t) => {
  const { checkAuthorization, ghauth, github, program } = t.context
  const expected = {user: 'some user', token: 'some token'}
  ghauth.yields()
  checkAuthorization.resolves(expected)

  return expect(github.authorize(program)).to.eventually.equal(expected)
})

test('github.authorize: rejects on general failure', (t) => {
  const { ghauth, github, program } = t.context
  const message = 'some error'
  ghauth.yields(new Error(message))

  return expect(github.authorize(program)).to.be.rejected.then(
    (error) => {
      expect(error).to.equal('GitHub Authorization failure: Error: some error')
    }
  )
})

test('github.authorize: rejects on bad credentials failure', (t) => {
  const { ghauth, github, program } = t.context
  ghauth.yields(new Error('Bad credentials'))

  return expect(github.authorize(program)).to.be.rejected.then(
    (error) => {
      expect(error).to.have.string('To troubleshoot the problem')
    }
  )
})
