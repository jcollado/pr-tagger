import chai from 'chai'
import {parseArguments} from '../src/arguments'
import test from 'ava'

const expect = chai.expect

const defaults = {
  version: 'some version',
  description: 'some description',
  owner: 'some owner',
  project: 'some project',
  user: 'some user',
  tag: 'some tag',
  logLevel: 'some log level'
}
const properties = ['owner', 'project', 'user', 'accessToken', 'tag', 'logLevel']

test('arguments.parseArguments: uses defaults', () => {
  const program = parseArguments(defaults, [])
  properties.forEach((property) => {
    if (typeof defaults[property] !== 'undefined') {
      expect(program).to.have.property(property, defaults[property])
    }
  })
})

test('arguments.parseArguments: parses arguments as expected', () => {
  const expected = {
    owner: 'some owner',
    project: 'custom project',
    user: 'custom user',
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

  properties.forEach((property) => {
    expect(program).to.have.property(property, expected[property])
  })
})

test('arguments.parseArguments: dryRun is not set by default', () => {
  const program = parseArguments(defaults, [])
  expect(program.dryRun).to.be.undefined
})

test('arguments.parseArguments: dryRun can be set', () => {
  const program = parseArguments(
    defaults, ['<node binary>', '<script>', '-n'])
  expect(program.dryRun).to.be.true
})
