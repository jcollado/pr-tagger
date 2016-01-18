/* global describe it */
'use strict'
const chai = require('chai')

const expect = chai.expect

describe('parseArguments', function () {
  const parseArguments = require('../lib/arguments').parseArguments

  const defaults = {
    version: 'some version',
    description: 'some description',
    user: 'some user',
    project: 'some project',
    tag: 'some tag',
    logLevel: 'some log level'
  }
  const properties = ['user', 'project', 'accessToken', 'tag', 'logLevel']

  it('uses defaults', function () {
    const program = parseArguments(defaults, [])
    properties.forEach(function (property) {
      if (typeof defaults[property] !== 'undefined') {
        expect(program).to.have.property(property, defaults[property])
      }
    })
  })

  it('parses arguments as expected', function () {
    const expected = {
      user: 'custom user',
      project: 'custom project',
      accessToken: 'custom access token',
      tag: 'custom tag',
      logLevel: 'debug'
    }
    const program = parseArguments(
      defaults, ['<node binary>', '<script>',
        '-u', expected.user,
        '-p', expected.project,
        '-a', expected.accessToken,
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
