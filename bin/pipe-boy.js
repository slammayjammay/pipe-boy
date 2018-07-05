#!/usr/bin/env node

const minimist = require('minimist');
const chalk = require('chalk');
const wrapAnsi = require('wrap-ansi');
const ConfigManager = require('../src/ConfigManager');
const PipeBoy = require('../src/PipeBoy');
const getTermWidth = require('../src/get-term-width');

const helpScreen =
`${chalk.green('pipe-boy')}

${chalk.bold('DESCRIPTION')}
    This command allows you to take output from one command, modify it, then use it as input into another command.

${chalk.bold('PROCESS')}
    ${chalk.green('Phase 1)')} If no arguments are passed, this phase is entered and you are prompted to enter a command. The output of this command will be used as input for the next. You can preview this output by pressing ${chalk.yellow('tab')} to preview on-screen, or ${chalk.yellow('shift+tab')} to preview inside ${chalk.cyan('less')}. Once finished, press ${chalk.yellow('enter')} to move on to phase 2.
    ${chalk.green('Phase 2)')} This is phase is entered once phase 1 is complete, or if any arguments are passed when initially running this command. In this phase you are prompted to enter another command, where the input from the previous phase is available as ${chalk.cyan('$1')}. You can navigate each line of the output by using the ${chalk.yellow('arrow keys')}. If a line is selected, that line will be available as ${chalk.cyan('$1')}.

${chalk.bold('COLORS')}
    Unfortunately many commands remove colored output when it's not printed directly to a terminal. You may have to enable colors for these command case-by-case. You can also setup custom functions to alias commands that force colorized output. See below.

${chalk.bold('CUSTOM FUNCTIONS')}
    One drawback of this tool is that any custom aliases or functions on your terminal are lost when executing commands. One possible solution to this is to redefine any custom functions inside the config file ${chalk.bold('{{HOME}}/.pipe-boy/functions.sh')}. Every time a command is run with this tool, these definitions will be prepended to the command string.
    Note: setting ${chalk.cyan('alias')}-es will not work, as they only take effect in interactive shells (all commands are run inside Node's ${chalk.cyan('child_process')}, which is not interactive).
`;

function showHelpScreen() {
	console.log(wrapAnsi(helpScreen, getTermWidth() - 1, { trim: false }));
}

const args = minimist(process.argv.slice(2), {
	alias: {
		h: 'help'
	}
});

if (args._[0] === 'config') {
	new ConfigManager(args);
} else if (args.help || args._[0] === 'help') {
	showHelpScreen();
} else {
	try {
		const program = new PipeBoy(process.argv.slice(2).join('\n'));

		program.catch(e => {
			console.log(e);
			process.exit(1);
		});

		program.then(() => {
			process.exit(0);
		});
	} catch(e) {
		console.log(e);
		process.exit(1);
	}
}
