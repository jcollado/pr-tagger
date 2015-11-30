/* global describe it before */
'use strict'
const chai = require('chai')
const requireInject = require('require-inject')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')
const expect = chai.expect

chai.use(sinonChai)

const prTagger = require('./pr-tagger')
const parseArguments = prTagger.parseArguments

describe('exec', function () {
  let prTagger

  before('setup spies', function () {
    prTagger = requireInject(
      './pr-tagger', {
        child_process: {
          execSync: sinon.stub()
        },
        winston: {
          Logger: sinon.stub().returns({
            cli: sinon.stub(),
            debug: sinon.stub()
          }),
          transports: {
            Console: sinon.stub()
          }
        }
      })
  })

  it('writes the command to the log', function () {
    const command = 'some command'
    const logger = prTagger.logger
    prTagger.exec(command)
    expect(logger.debug).to.have.been.calledWith('Command: %s', command)
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
