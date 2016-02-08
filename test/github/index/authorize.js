import requireInject from 'require-inject'
import sinon from 'sinon'
import 'sinon-as-promised'
import test from 'ava'

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

test('github.authorize: uses token from command line if available', async function (t) {
  const { checkAuthorization, ghauth, github, program } = t.context
  const expected = {user: 'some user', token: 'some token'}
  program.accessToken = 'some token'
  checkAuthorization.resolves(expected)

  await github.authorize(program)
  t.false(ghauth.called)
})

test('github.authorize: uses token from configuration file by default', async function (t) {
  const { checkAuthorization, ghauth, github, program } = t.context
  ghauth.yields()
  checkAuthorization.resolves()

  await github.authorize(program)
  t.true(ghauth.called)
})

test('github.authorize: resolves to authorization data on success', async function (t) {
  const { checkAuthorization, ghauth, github, program } = t.context
  const expected = {user: 'some user', token: 'some token'}
  ghauth.yields()
  checkAuthorization.resolves(expected)

  const authData = await github.authorize(program)
  t.same(authData, expected)
})

test('github.authorize: rejects on general failure', async function (t) {
  const { ghauth, github, program } = t.context
  const message = 'some error'
  ghauth.yields(new Error(message))

  try {
    await github.authorize(program)
  } catch (error) {
    t.is(error, 'GitHub Authorization failure: Error: some error')
  }
})

test('github.authorize: rejects on bad credentials failure', async function(t) {
  const { ghauth, github, program } = t.context
  ghauth.yields(new Error('Bad credentials'))

  try {
    await github.authorize(program)
  } catch (error) {
    t.true(error.includes('To troubleshoot the problem'))
  }
})
