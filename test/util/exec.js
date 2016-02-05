import chai from 'chai'
import requireInject from 'require-inject'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import test from 'ava'

const expect = chai.expect
chai.use(sinonChai)

const command = 'some command'

test.beforeEach((t) => {
  const childProcess = {
    execSync: sinon.stub()
  }
  const logger = {
    cli: sinon.spy(),
    debug: sinon.spy(),
    error: sinon.spy()
  }

  const stubs = {
    child_process: childProcess,
    [require.resolve('../../src/logging')]: { logger }
  }
  const exec = requireInject('../../src/util', stubs).exec

  t.context = { childProcess, exec, logger }
})

test('util.exec: writes the command to the log', (t) => {
  const { exec, logger } = t.context

  exec(command)
  expect(logger.debug).to.have.been.calledWith('Command: %s', command)
})

test('util.exec: returns command stdout on success', (t) => {
  const { childProcess, exec } = t.context
  const expectedStdout = 'this is the command stdout'
  childProcess.execSync.returns(expectedStdout)

  const stdout = exec(command)
  expect(stdout).to.equal(expectedStdout)
})

test('util.exec: logs error and exits on failure', (t) => {
  const { childProcess, exec, logger } = t.context
  const expectedError = new Error('some error')
  childProcess.execSync.throws(expectedError)

  sinon.stub(process, 'exit')
  try {
    exec(command)
    expect(logger.error).to.have.been.calledWith(expectedError)
    expect(process.exit).to.have.been.calledWith(1)
  } finally {
    process.exit.restore()
  }
})
