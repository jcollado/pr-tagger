#!/usr/bin/env node
const program = require('commander')

const version = require('./package').version

program.version(version)

program.parse(process.argv)
