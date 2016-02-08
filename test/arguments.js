import {parseArguments} from '../src/arguments'
import test from 'ava'

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

test('arguments.parseArguments: uses defaults', (t) => {
  const program = parseArguments(defaults, [])
  properties.forEach((property) => {
    if (typeof defaults[property] !== 'undefined') {
      t.is(program[property], defaults[property])
    }
  })
})

test('arguments.parseArguments: parses arguments as expected', (t) => {
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
    t.is(program[property], expected[property])
  })
})

test('arguments.parseArguments: dryRun is not set by default', (t) => {
  const program = parseArguments(defaults, [])
  t.is(typeof program.dryRun, 'undefined')
})

test('arguments.parseArguments: dryRun can be set', (t) => {
  const program = parseArguments(
    defaults, ['<node binary>', '<script>', '-n'])
  t.true(program.dryRun)
})
