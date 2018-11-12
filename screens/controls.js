const chalk = require('chalk');

const controlsScreen =
`${chalk.yellow('KEYS')}
    ${chalk.yellow('tab')} ${chalk.gray('-- preview on-screen')} ${chalk.gray('(if on phase 2, previews inside')} ${chalk.cyan('less')}${chalk.gray(')')}
    ${chalk.yellow('shift+tab')} ${chalk.gray('-- preview inside')} ${chalk.cyan('less')}
    ${chalk.yellow('enter')} ${chalk.gray('-- confirm/proceed')}
    ${chalk.yellow('shift+arrow keys')} ${chalk.gray('-- scroll output horizontally/vertically. Hold')} ${chalk.yellow('ctrl')} ${chalk.gray('to scroll a half-page')}
    ${chalk.yellow('up/down arrows keys')} ${chalk.gray('-- select individual lines out of')} ${chalk.green('$1')} ${chalk.bold('*')}
    ${chalk.yellow('escape')} ${chalk.gray('-- if selecting lines out of')} ${chalk.green('$1')}${chalk.gray(', resets selection back to entire string')}

${chalk.cyan('COMMANDS')}
    ${chalk.cyan(':h')}${chalk.gray(',')} ${chalk.cyan(':help')} ${chalk.gray('-- print help screen')}
    ${chalk.cyan(':c')}${chalk.gray(',')} ${chalk.cyan(':controls')} ${chalk.gray('-- print controls screen')}
    ${chalk.cyan(':back')} ${chalk.gray('-- go back to phase 1')} ${chalk.bold('*')}

${chalk.green('KEYWORDS/FLAGS')}
    ${chalk.green('$1')} ${chalk.gray('-- input from previous command or currently selected line')} ${chalk.bold('*')}
    ${chalk.green(':e')}${chalk.gray(',')} ${chalk.green(':E')}${chalk.gray(',')} ${chalk.green(':escaped')} ${chalk.gray('--')} ${chalk.gray('escapes input string when populating')} ${chalk.green('$1')} ${chalk.bold('*+')}
    ${chalk.green(':i')}${chalk.gray(',')} ${chalk.green(':I')}${chalk.gray(',')} ${chalk.green(':interactive')} ${chalk.gray('--')} ${chalk.gray('inherit terminal stdio when running commands')} ${chalk.bold('+')}

${chalk.bold('*')} ${chalk.gray('-- available in phase 2')}
${chalk.bold('+')} ${chalk.gray('-- must be appended in a comment at the end of the command')}
`;

module.exports = () => controlsScreen;
