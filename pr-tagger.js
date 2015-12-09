#!/usr/bin/env node
'use strict'

const main = require('./lib/main')

if (require.main === module) {
  const retcode = main()
  if (retcode !== 0) {
    process.exit(retcode)
  }
}
