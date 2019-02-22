const chalk = require('chalk');

const controlsScreen =
`${chalk.yellow('KEYS')}
    ${chalk.yellow('ENTER')} ${chalk.gray('-- confirm/proceed')}
    ${chalk.yellow('TAB')} ${chalk.gray('-- preview on-screen')} ${chalk.gray('(if on phase 2, previews inside')} ${chalk.cyan('less')}${chalk.gray(')')}
    ${chalk.yellow('SHIFT+tab')} ${chalk.gray('-- preview inside')} ${chalk.cyan('less')}
    ${chalk.yellow('↑/↓ (up/down)')} ${chalk.gray('-- select individual lines out of')} ${chalk.green('$1')} ${chalk.bold('*')}
    ${chalk.yellow('SHIFT+↑/↓ (up/down)')} ${chalk.gray('-- scroll output horizontally/vertically. Hold')} ${chalk.yellow('ctrl')} ${chalk.gray('to scroll a half-page')}
    ${chalk.yellow('ESC')} ${chalk.gray('cancel individual line selection')} ${chalk.bold('*')}
    ${chalk.yellow('CTRL+r')} ${chalk.gray('refresh/redraw')}
    ${chalk.yellow('CTRL+e')} ${chalk.gray('erase and reset any input and output (does not change phases)')}

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
