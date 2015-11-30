/* global describe it beforeEach */
'use strict'
const chai = require('chai')
const requireInject = require('require-inject')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')
const expect = chai.expect

chai.use(sinonChai)

describe('exec', function () {
  const command = 'some command'
  let stubs

  beforeEach('create stubs', function () {
    stubs = {
      child_process: {
        execSync: sinon.stub()
      },
      winston: {
        Logger: sinon.stub().returns({
          cli: sinon.stub(),
          debug: sinon.stub(),
          error: sinon.stub()
        }),
        transports: {
          Console: sinon.stub()
        }
      }
    }
  })

  it('writes the command to the log', function () {
    const prTagger = requireInject('./pr-tagger', stubs)

    prTagger.exec(command)
    expect(prTagger.logger.debug).to.have.been.calledWith('Command: %s', command)
  })

  it('returns command stdout on success', function () {
    const expectedStdout = 'this is the command stdout'
    stubs.child_process.execSync.returns(expectedStdout)
    const prTagger = requireInject('./pr-tagger', stubs)

    const stdout = prTagger.exec(command)
    expect(stdout).to.equal(expectedStdout)
  })

  it('logs error and exits on failure', function () {
    const expectedError = new Error('some error')
    stubs.child_process.execSync.throws(expectedError)
    const prTagger = requireInject('./pr-tagger', stubs)
    const logger = prTagger.logger

    sinon.stub(process, 'exit')
    try {
      prTagger.exec(command)
      expect(logger.error).to.have.been.calledWith(expectedError)
      expect(process.exit).to.have.been.calledWith(1)
    } finally {
      process.exit.restore()
    }
  })
})

describe('parseArguments', function () {
  const parseArguments = require('./pr-tagger').parseArguments

  const defaults = {
    version: 'some version',
    description: 'some description',
    user: 'some user',
    project: 'some project',
    tag: 'some tag',
    logLevel: 'some log level'
  }
  const properties = ['user', 'project', 'tag', 'logLevel']

  it('uses defaults', function () {
    const program = parseArguments(defaults, [])
    properties.forEach(function (property) {
      expect(program).to.have.property(property, defaults[property])
    })
  })

  it('parses arguments as expected', function () {
    const expected = {
      user: 'custom user',
      project: 'custom project',
      tag: 'custom tag',
      logLevel: 'debug'
    }
    const program = parseArguments(
      defaults, ['<node binary>', '<script>',
        '-u', expected.user,
        '-p', expected.project,
        '-t', expected.tag,
        '-l', expected.logLevel
      ])

    properties.forEach(function (property) {
      expect(program).to.have.property(property, expected[property])
    })
  })

  it('dryRun is not set by default', function () {
    const program = parseArguments(defaults, [])
    expect(program.dryRun).to.be.undefined
  })

  it('dryRun can be set', function () {
    const program = parseArguments(
      defaults, ['<node binary>', '<script>', '-n'])
    expect(program.dryRun).to.be.true
  })
})
