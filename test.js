/* global describe it */
const expect = require('chai').expect

const parseArguments = require('./pr-tagger').parseArguments

describe('parseArguments', function () {
  it('uses defaults', function () {
    const defaults = {
      version: 'some version',
      description: 'some description',
      user: 'some user',
      project: 'some project',
      tag: 'some tag',
      logLevel: 'some log level'
    }
    const program = parseArguments(defaults, [])
    const properties = ['user', 'project', 'tag', 'logLevel']
    properties.forEach(function (property) {
      expect(program).to.have.property(property, defaults[property])
    })
  })
})
