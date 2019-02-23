const figlet = require('figlet');
const chalk = require('chalk');
const wrapAnsi = require('wrap-ansi');
const getTermWidth = require('./get-term-width');

class Screen {
	// NOTE: defaults need to be updated every time the default config "banner"
	// object is updated
	banner(options = {}) {
		options.text = options.text || 'PipeBoy';
		options.color = options.color || 'green';
		options.font = options.font || 'chunky';
		options.horizontalLayout = options.horizontalLayout || 'default';
		options.verticalLayout = options.verticalLayout || 'default';

		const { text, color, font, horizontalLayout, verticalLayout } = options;

		return chalk[color](figlet.textSync(text, {
			font,
			horizontalLayout,
			verticalLayout
		}));
	}

	config() {
		return this._wrap(configScreen());
	}

	controls() {
		return this._wrap(controlsScreen());
	}

	help() {
		let screen = '';

		// `wrapAnsi` will mangle any `figlet` output
		screen += this.banner() + '\n\n';
		screen += this._wrap(helpScreen());
		return screen;
	}

	_wrap(text) {
		return wrapAnsi(text, getTermWidth(), { trim: false });
	}
}

// Beware: awkward formatting ahead, on purpose

function helpScreen() {
return (
`${chalk.bold('DESCRIPTION')}
    This command allows you to take output from one command, modify it, then use it as input into another command.

    ${chalk.bold('PROCESS')}
    ${chalk.green('Phase 1)')} If no arguments are passed, this phase is entered and you are prompted to enter a command. The output of this command will be used as input for the next. You can preview this output by pressing ${chalk.yellow('tab')} to preview on-screen, or ${chalk.yellow('shift+tab')} to preview inside ${chalk.cyan('less')}. Once finished, press ${chalk.yellow('enter')} to move on to phase 2.
    ${chalk.green('Phase 2)')} This is phase is entered once phase 1 is complete, or if any arguments are passed when initially running this command. In this phase you are prompted to enter another command, where the input from the previous phase is available as ${chalk.green('$1')}. You can navigate each line of the output by using the ${chalk.yellow('arrow keys')}. If a line is selected, that line will be available as ${chalk.green('$1')}.
    By default, the ${chalk.green('$1')} string is not escaped. You can escape it by passing the ${chalk.green(':escaped')} flag (see ${chalk.cyan('pipe-boy --controls')} for more info) or by setting the ${chalk.green('alwaysEscapeInput')} config option (see ${chalk.cyan('pipe-boy config --help')} for more info). If it is escaped, newlines will be replaced by spaces.

    ${chalk.bold('COLORS')}
    Unfortunately many commands remove colored output when it's not printed directly to a terminal. You may have to enable colors for these commands case-by-case. You can also setup custom functions to alias commands that force colorized output. See below.

    ${chalk.bold('CUSTOM FUNCTIONS')}
    One drawback of this tool is that any custom aliases or functions on your terminal are lost when executing commands. One possible solution to this is to redefine any custom functions inside the config file ${chalk.bold('{{HOME}}/.pipe-boy/functions.sh')}. Every time a command is run with this tool, these definitions will be prepended to the command string.
    Note: setting ${chalk.cyan('alias')}-es will not work, as they only take effect in interactive shells (all commands are run inside Node's ${chalk.cyan('child_process')}, which is not interactive).

    ${chalk.bold('OPTIONS')}
    -c, --controls   Print controls screen.
    -h, --help       Print this help screen.
    -v, --version    Print the version of this package.

    ${chalk.bold('RUNTIME CONFIG')}
    Providing config keys and values as CLI options can change the config object on a per-run basis. This will not overwrite the config file. Nested keys can be separated by a period (.). See ${chalk.cyan('pipe-boy config')} for a list of available options.

    ${chalk.cyan('pipe-boy --banner.color red')} ${chalk.gray('# runs as usual changing the banner to red')}
`
);
}

function controlsScreen() {
return (
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
`
);
}

function configScreen() {
return (
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
    ${chalk.green('FORCE_COLOR')} -- sets the ${chalk.cyan('$FORCE_COLOR')} environment variable when executing commands. Defaults to ${chalk.cyan('true')}.
    ${chalk.green('setCwdOnCd')} -- attempts to detect when ${chalk.cyan('cd')} is present and sets the working directory for sub commands (used during phase 2). Defaults to ${chalk.cyan('true')}.
    ${chalk.green('alwaysEscapeInput')} -- escapes input string when populating ${chalk.green('$1')}. Defaults to false.
    ${chalk.green('banner.text')} -- the text used as the banner. Defaults to ${chalk.green('PipeBoy')}.
    ${chalk.green('banner.font')} -- the font used as the banner. Defaults to ${chalk.green('chunky')}.
    ${chalk.green('banner.color')} -- the color used as the banner. Defaults to ${chalk.green('green')}.
    ${chalk.green('banner.horizontalLayout')} -- the horizontalLayout used as the banner. Defaults to ${chalk.green('default')}.
    ${chalk.green('banner.verticalLayout')} -- the verticalLayout used as the banner. Defaults to ${chalk.green('default')}.

${chalk.bold('NOTE ABOUT BANNER')}
    ${chalk.green('PipeBoy')} makes use of the amazing ${chalk.green('figlet')} npm package to make the banner. For more information on banner options or to see a full list of available fonts, see https://www.npmjs.com/package/figlet.
`
);
}

module.exports = Screen;
