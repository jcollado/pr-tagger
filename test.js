/* global describe it before after */
const childProcess = require('child_process')

const chai = require('chai')
const proxyquire = require('proxyquire')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')
const expect = chai.expect

chai.use(sinonChai)

const prTagger = require('./pr-tagger')
const exec = prTagger.exec
const parseArguments = prTagger.parseArguments
const logger = prTagger.logger

describe('exec', function () {
  before('setup spies', function () {
    proxyquire(
      './pr-tagger', {
        childProcess: {
          execSync: sinon.stub(childProcess, 'execSync')
        }
      })
    sinon.stub(logger, 'debug')
    sinon.stub(process, 'exit')
  })

  it('writes the command to the log', function () {
    const command = 'some command'
    exec(command)
    expect(logger.debug).to.have.been.calledWith('Command: %s', command)
  })

  after('restore spies', function () {
    childProcess.execSync.restore()
    logger.debug.restore()
    process.exit.restore()
  })
})

describe('parseArguments', function () {
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
