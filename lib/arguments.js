'use strict'

const program = require('commander')

function parseArguments (defaults, argv) {
  program
    .version(defaults.version)
    .description(defaults.description)
    .option('-u, --user [user]', 'GitHub user', defaults.user)
    .option('-p, --project [project]', 'GitHub project', defaults.project)
    .option('-t, --tag [tag]', 'Git tag', defaults.tag)
    .option('-l, --log-level [logLevel]',
            'Log level',
            /^(error|warn|info|verbose|debug|silly)$/i,
            defaults.logLevel)
    .option('-n --dry-run',
            'Log actions, but skip adding comments to GitHub PRs')
    .parse(argv)
  program.name = defaults.name

  return program
}

module.exports = {
  parseArguments
}
