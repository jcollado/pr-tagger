import program from 'commander'

function parseArguments (defaults, argv) {
  program
    .version(defaults.version)
    .description(defaults.description)
    .option('-p, --project [project]', 'GitHub project', defaults.project)
    .option('-o, --owner [owner]', 'GitHub project owner', defaults.owner)
    .option('-a, --access-token [token]', 'GitHub access token')
    .option('-u, --user [user]', 'GitHub access token user', defaults.user)
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

export {
  parseArguments
}
