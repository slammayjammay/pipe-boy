const chalk = require('chalk');

const configScreen =
`${chalk.bold('DESCRIPTION')}
    Command line API to manage the configuration file(s).

${chalk.bold('USAGE')}
    $ pipe-boy config <command> <args> ...

${chalk.bold('EXAMPLES')}
    $ pipe-boy config help                  # show this help screen
    $ pipe-boy config get                   # print entire config
    $ pipe-boy config get <key> ...         # print key/value pair(s)
    $ pipe-boy config set <key> <value> ... # set key/value pair(s)
    $ pipe-boy config reset                 # reset entire config file back to defaults
    $ pipe-boy config reset <key> ...       # reset key(s) back to defaults
    $ pipe-boy config check                 # scan config for superfluous keys
    $ pipe-boy config path                  # print path to config file

${chalk.bold('OPTIONS')}
    ${chalk.green('FORCE_COLOR')} -- sets the ${chalk.cyan('$FORCE_COLOR')} environment variable when executing commands. Defaults to true.
    ${chalk.green('setCwdOnCd')} -- attempts to detect when ${chalk.cyan('cd')} is present and sets the working directory for sub commands (used during phase 2). Defaults to true.
    ${chalk.green('alwaysEscapeInput')} -- escapes input string when populating ${chalk.green('$1')}. Defaults to false.
`;

module.exports = () => configScreen;
