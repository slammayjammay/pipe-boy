const chalk = require('chalk');
const getBanner = require('./get-banner-string');

const helpScreen =
`${chalk.green(getBanner())}

${chalk.bold('DESCRIPTION')}
    This command allows you to take output from one command, modify it, then use it as input into another command.

${chalk.bold('PROCESS')}
    ${chalk.green('Phase 1)')} If no arguments are passed, this phase is entered and you are prompted to enter a command. The output of this command will be used as input for the next. You can preview this output by pressing ${chalk.yellow('tab')} to preview on-screen, or ${chalk.yellow('shift+tab')} to preview inside ${chalk.cyan('less')}. Once finished, press ${chalk.yellow('enter')} to move on to phase 2.
    ${chalk.green('Phase 2)')} This is phase is entered once phase 1 is complete, or if any arguments are passed when initially running this command. In this phase you are prompted to enter another command, where the input from the previous phase is available as ${chalk.cyan('$1')}. You can navigate each line of the output by using the ${chalk.yellow('arrow keys')}. If a line is selected, that line will be available as ${chalk.cyan('$1')}.

${chalk.bold('KEYWORDS/FLAGS')}
    ${chalk.green('$1')} -- The contents of phase 1's entire output string (available on phase 2). If using the arrow keys to navigate, this will instead be populated by the currently selected line.
    ${chalk.green(':back')} -- Enter this to go back to phase one (available on phase 2).
    ${chalk.green(':i, :I, :interactive')} -- By default, child processes do not inherit IO from the terminal. To inherit terminal IO in sub commands, append a comment containing this flag. (Note: this flag is targeted toward terminal text editors -- odd behavior may occur when other interactive commands are run.)
        ${chalk.cyan('$ some-command # :interactive')}
        ${chalk.cyan('$ vim some-file.txt #:I')}

${chalk.bold('COLORS')}
    Unfortunately many commands remove colored output when it's not printed directly to a terminal. You may have to enable colors for these commands case-by-case. You can also setup custom functions to alias commands that force colorized output. See below.

${chalk.bold('CUSTOM FUNCTIONS')}
    One drawback of this tool is that any custom aliases or functions on your terminal are lost when executing commands. One possible solution to this is to redefine any custom functions inside the config file ${chalk.bold('{{HOME}}/.pipe-boy/functions.sh')}. Every time a command is run with this tool, these definitions will be prepended to the command string.
    Note: setting ${chalk.cyan('alias')}-es will not work, as they only take effect in interactive shells (all commands are run inside Node's ${chalk.cyan('child_process')}, which is not interactive).

${chalk.bold('OPTIONS')}
    -h, --help       Print this help screen.
    -c, --controls   Print controls.
    -v, --version    Print the version of this package.
`;

module.exports = () => helpScreen;
