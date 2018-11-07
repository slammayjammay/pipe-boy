const chalk = require('chalk');

const controlsScreen = `
${chalk.yellow('KEYS')}
    ${chalk.yellow('tab')} ${chalk.gray('-- preview')}
    ${chalk.yellow('shift+tab')} ${chalk.gray('-- preview inside')} ${chalk.cyan('less')}
    ${chalk.yellow('enter')} ${chalk.gray('-- confirm/proceed')}
    ${chalk.yellow('arrow keys')} ${chalk.gray('-- navigate/scroll output')} ${chalk.bold('**')}

${chalk.green('KEYWORDS/FLAGS')}
    ${chalk.green(':back')} ${chalk.gray('-- go back')} ${chalk.bold('**')}
    ${chalk.green('$1')} ${chalk.gray('-- input from previous command or currently selected line')} ${chalk.bold('**')}
    ${chalk.green(':i')}${chalk.gray(',')} ${chalk.green(':I')}${chalk.gray(',')} ${chalk.green(':interactive')} ${chalk.gray('--')} ${chalk.gray('inherit terminal stdio when running commands. Must be appended in a comment to the end of the command.')}

${chalk.bold('**')} ${chalk.gray('-- available phase 2')}
`;

module.exports = () => controlsScreen;
