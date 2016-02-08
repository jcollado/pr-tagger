import requireInject from 'require-inject'
import sinon from 'sinon'
import 'sinon-as-promised'
import test from 'ava'

test.beforeEach((t) => {
  const getUrl = sinon.stub().returns('some url')
  const git = {
    getSemverTags: sinon.stub(),
    getMergeCommits: sinon.stub(),
    getPRs: sinon.stub()
  }
  const github = {
    authorize: sinon.stub(),
    writeComments: sinon.stub()
  }
  const logger = {
    debug: sinon.spy(),
    info: sinon.spy(),
    error: sinon.spy()
  }
  const parseArguments = sinon.stub()
  const stubs = {
    [require.resolve('../src/arguments')]: { parseArguments },
    [require.resolve('../src/git')]: git,
    [require.resolve('../src/github')]: github,
    [require.resolve('../src/logging')]: { logger },
    [require.resolve('../src/util')]: { getUrl }
  }
  const main = requireInject('../src/main', stubs).default

  t.context = { git, github, logger, main, parseArguments }
})

test('main: returns when user name is not found', async function (t) {
  const { git, logger, main, parseArguments } = t.context
  git.getSemverTags.returns(['a tag', 'another tag'])
  parseArguments.returns({logLevel: 'debug'})
  const retcode = await main()
  t.is(retcode, 1)
  t.true(logger.error.calledWith(
    'User name not found in package.json. ' +
    'Use -u/--user to pass it explicitly.'))
})

test('main: returns when project name is not found', async function (t) {
  const { git, logger, main, parseArguments } = t.context
  git.getSemverTags.returns(['a tag', 'another tag'])
  parseArguments.returns({logLevel: 'debug', user: 'user'})
  const retcode = await main()
  t.is(retcode, 1)
  t.true(logger.error.calledWith(
    'Project name not found in package.json. ' +
    'Use -p/--project to pass it explicitly'))
})

test('main: returns when no tags are found in repository', async function (t) {
  const { git, logger, main, parseArguments } = t.context
  git.getSemverTags.returns([])
  parseArguments.returns({logLevel: 'debug', user: 'user', project: 'project'})
  const retcode = await main()
  t.is(retcode, 1)
  t.true(logger.error.calledWith('No tags found in repository'))
})

test('main: returns when tag is not semver compliant', async function (t) {
  const { git, logger, main, parseArguments } = t.context
  git.getSemverTags.returns(['a tag', 'another tag'])
  const tag = 'not a semver tag'
  parseArguments.returns({
    logLevel: 'debug',
    user: 'user',
    project: 'project',
    tag
  })
  const retcode = await main()
  t.is(retcode, 1)
  t.true(logger.error.calledWith('Tag not semver compliant: %s', tag))
})

test('main: returns when tag is not found in repository', async function (t) {
  const { git, logger, main, parseArguments } = t.context
  git.getSemverTags.returns(['v1.0.0'])
  const tag = 'v0.1.0'
  parseArguments.returns({
    logLevel: 'debug',
    user: 'user',
    project: 'project',
    tag
  })
  const retcode = await main()
  t.is(retcode, 1)
  t.true(logger.error.calledWith('Tag not found in repository: %s', tag))
})

test('main: logs number of comments written on success', async function (t) {
  const { git, github, logger, main, parseArguments } = t.context
  git.getSemverTags.returns(['v1.0.0'])
  git.getMergeCommits.returns(['a commit', 'another commit'])
  git.getPRs(['a PR', 'another PR'])
  parseArguments.returns({
    logLevel: 'debug',
    user: 'user',
    project: 'project',
    accessToken: 'token',
    tag: 'v1.0.0'
  })
  github.authorize.resolves('authorization data')
  const newComments = ['a new comment', null, 'another new comment']
  github.writeComments.resolves(newComments)
  const retcode = await main()
  t.is(retcode, 0)
  t.true(logger.info.calledWith('%d comments written', 2))
  t.true(logger.info.calledWith('Done!'))
})

test('main: writes unexpected error to log on failure', async function (t) {
  const { git, github, logger, main, parseArguments } = t.context
  git.getSemverTags.returns(['v1.0.0', 'v0.0.1'])
  git.getMergeCommits.returns(['a commit', 'another commit'])
  git.getPRs(['a PR', 'another PR'])
  parseArguments.returns({
    logLevel: 'debug',
    user: 'user',
    project: 'project',
    accessToken: 'token',
    tag: 'v1.0.0'
  })
  github.authorize.resolves('authorization data')
  const error = new Error('some error')
  github.writeComments.rejects(error)
  const retcode = await main()
  t.is(retcode, 1)
  t.true(logger.error.calledWith(error))
})
