const { homedir } = require('os');
const { readFileSync } = require('fs');
const { execSync, spawnSync } = require('child_process');
const readline = require('readline');
const chalk = require('chalk');
const ansiEscapes = require('ansi-escapes');
const wrapAnsi = require('wrap-ansi');
const stripAnsi = require('strip-ansi');
const pager = require('node-pager');
const TerminalJumper = require('terminal-jumper');
const getTermWidth = require('./get-term-width');
const bannerScreen = require('../screens/banner');
const controlsScreen = require('../screens/controls');
const helpScreen = require('../screens/help');
require('./readline-hack');

const CONFIG_DIR_PATH = `${homedir()}/.pipe-boy/`;
const TAB_NUM_SPACES = 8;
const TAB_FAKER = new Array(TAB_NUM_SPACES).join(' ');
const ESCAPE_STRING_REGEX = /#.*:([eE]|escaped)\b/;
const INTERACTIVE_FLAG_REGEX = /#.*:([iI]|interactive)\b/;

const DEBUG = false;

class PipeBoy {
	constructor(input = '') {
		this.input = input.replace(/\t/g, TAB_FAKER);

		this.onKeypress = this.onKeypress.bind(this);
		this.onEarlyExit = this.onEarlyExit.bind(this);

		this.jumper = null;
		this.isPhase1 = false;
		this.isPhase2 = false;
		this.phase1Command = '';
		this.cwd = null;
		this.isSelecting = false;
		this.selectingIdx = -1;
		this._lastRlPrevRows = null;

		if (this.input) {
			this.isPhase2 = true;
		} else {
			this.isPhase1 = true;
		}

		return this.begin();
	}

	begin() {
		process.on('exit', this.onEarlyExit);
		readline.emitKeypressEvents(process.stdin, this.rl);

		// try to require config file, otherwise set as empty object
		try {
			this.config = require(`${CONFIG_DIR_PATH}/config.json`);
		} catch (e) {
			this.config = {};
		}

		// try to read custom functions, otherwise set as empty string
		try {
			this.customFunctions = readFileSync(`${CONFIG_DIR_PATH}/functions.sh`).toString();
		} catch(e) {
			this.customFunctions = '';
		}

		this.rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
			prompt: '',
			historySize: 0
		});
		this.rl.input.on('keypress', this.onKeypress);

		this.jumper = this._createTerminalJumper();
		this._createJumperTemplate();

		if (this.isPhase1) {
			return this.phase1();
		} else if (this.isPhase2) {
			return this.phase2();
		}
	}

	_createTerminalJumper() {
		const headerDiv = {
			id: 'headerDiv',
			top: 0,
			left: 0,
			width: 1
		};

		const phaseDiv = {
			id: 'phaseDiv',
			left: 0,
			top: headerDiv.id,
			width: 0.2
		};

		const infoDiv = {
			id: 'infoDiv',
			left: phaseDiv.id,
			top: headerDiv.id,
			width: 0.7
		};

		const commandDiv = {
			id: 'commandDiv',
			left: 0,
			top: infoDiv.id,
			width: 1,
			wrapOnWord: false
		};

		const outputDiv = {
			id: 'outputDiv',
			left: 0,
			top: commandDiv.id,
			width: 0.9,
			overflowX: 'scroll'
		};

		const indicatorEraseDiv = {
			id: 'indicatorEraseDiv',
			left: outputDiv.id,
			top: 0,
			width: 0.1,
			height: 'full'
		};

		const debugDiv = {
			id: 'debugger',
			width: 0.3,
			left: 0.7,
			top: 0
		};

		return new TerminalJumper({
			divisions: [headerDiv, phaseDiv, infoDiv, commandDiv, outputDiv, indicatorEraseDiv],
			debug: DEBUG ? debugDiv : false
		});
	}

	_createJumperTemplate() {
		this.jumper.addBlock(`headerDiv.header`, chalk.green(bannerScreen()));
		this.jumper.addBlock(`headerDiv`);
		const headerWidth = this.jumper.getDivision('headerDiv').width();

		const infoText = [
			chalk.gray(`${chalk.cyan(':h')}, ${chalk.cyan(':help')}`),
			chalk.gray(`${chalk.cyan(':c')}, ${chalk.cyan(':controls')}`)
		].join('\n');

		this.jumper.addBlock('infoDiv.info', infoText);
		this.jumper.addBlock('phaseDiv.phase');
		this.jumper.addBlock('commandDiv.input');
		this.jumper.addBlock('commandDiv.empty');
		this.jumper.addBlock('commandDiv.divider');
		this.jumper.addBlock('outputDiv.output');

		this.jumper.getBlock('commandDiv.divider').content(
			new Array(this.jumper.getDivision('outputDiv').width()).join('=')
		);
	}

	async phase1() {
		this.jumper.getBlock('phaseDiv.phase').content('Phase 1');
		const inputBlock = this.jumper.getBlock('commandDiv.input');

		this.jumper
			.chain()
			.render()
			.jumpTo('commandDiv.input', -1, inputBlock.height() - 1)
			.execute();

		const command = await new Promise(resolve => {
			const that = this;

			this.rl.on('line', function onLine(line) {
				// show warning if line is empty
				if (line.trim() === '') {
					that.jumper.getBlock('outputDiv.output').content(chalk.red('Please enter a command'));
					that.jumper
						.chain()
						.render()
						.jumpTo('commandDiv.input', -1)
						.execute();
					return;
				}

				// otherwise proceed to phase 2
				that.rl.removeListener('line', onLine);
				resolve(line);
			});
		});

		if (this.config.setCwdOnCd) {
			this.cwd = this.parseCwdOnCd(command);
		}

		const [output] = await this.getOutputForCommand(command);

		this.input = output.trim().replace(/\t/g, TAB_FAKER);
		this.phase1Command = command;
		this.isPhase1 = false;
		this.isPhase2 = true;

		return this.phase2();
	}

	parseCwdOnCd(command) {
		const regex = /cd\s+([^\s"]+|"[^"]*")+/;
		const match = regex.exec(command);

		if (match == null) {
			return null;
		} else if (match) {
			let cwd = match && match[1];
			if (cwd[0] === '"' && cwd[cwd.length - 1] === '"') {
				cwd = cwd.slice(1, cwd.length - 1);
			}

			return cwd;
		}
	}

	async phase2() {
		this.rl.line = '';
		this.rl.cursor = this.rl.line.length;

		this.jumper.getBlock('phaseDiv.phase').content('Phase 2');
		this.jumper.getBlock('commandDiv.input').content(this.rl.line);
		this._populateOutputDiv(this.input);

		this.jumper
			.chain()
			.render()
			.jumpTo('commandDiv.input', -1)
			.execute();

		let command = await new Promise(resolve => {
			this.rl.once('line', line => resolve(line));
		});

		if (command.trim() === ':back') {
			return this.onBackCommand();
		}

		const input = (() => {
			if (this.isSelecting) {
				const division = this.jumper.getDivision('outputDiv');
				const block = division.getBlock('output');
				const line = block.getRow(division.scrollPosY() + this.selectingIdx);
				return stripAnsi(line);
			} else {
				return this.input;
			}
		})();

		process.removeListener('exit', this.onEarlyExit);

		this.jumper.erase();
		this.jumper.destroy();
		this.rl.close();

		const [output, status, originalCommand] = await this.getOutputForCommand(
			command,
			{ cwd: this.cwd, input }
		);

		let commandThatRan = '$ ';
		if (this.cwd) {
			commandThatRan += `cd "${this.cwd}" && `;
		}
		commandThatRan += originalCommand;

		console.log(chalk.cyan(commandThatRan));
		console.log();
		console.log(new Array(process.stdout.columns).join('='));
		console.log();

		return Promise.resolve([output, status]);
	}

	_populateOutputDiv(output) {
		const division = this.jumper.getDivision('outputDiv');
		const content = wrapAnsi(output, division.width() - 3, { trim: false });
		division.getBlock('output').content(content);

		division.scrollX(0);
		division.scrollY(0);
	}

	onBackCommand() {
		this.jumper.getBlock('outputDiv.output').content('');
		this.jumper.getBlock('commandDiv.input').content(this.phase1Command);
		this.rl.line = this.phase1Command;
		this.rl.cursor = this.rl.line.length;
		const { rows, cols } = this.rl._getCursorPos();
		this.rl.prevRows = rows;
		process.stdout.write(ansiEscapes.cursorTo(cols, rows));
		this.isPhase1 = true;
		this.isPhase2 = false;
		this.cwd = null;
		this.isSelecting = false;
		this.selectingIdx = -1;
		return this.phase1();
	}

	onKeypress(char, key) {
		let promise;

		const isArrowKey = ['up', 'down', 'left', 'right'].includes(key.name);

		if (key.name === 'tab') {
			promise = this.onTab(char, key);
		} else if (isArrowKey) {
			if (key.meta && key.shift) {
				promise = this.onMetaShiftArrow(char, key);
			} else {
				promise = this.onArrow(char, key);
			}
		} else if (key.name !== 'return') {
			if (this.rl.prevRows !== undefined && this.rl.prevRows !== this._lastRlPrevRows) {
				this._lastRlPrevRows = this.rl.prevRows;
				this.jumper.getBlock('commandDiv.input').content(this.rl.line);

				this.jumper
					.chain()
					.render()
					.jumpTo('commandDiv.input', -1, this.rl.prevRows)
					.execute();
			}
		}

		if (promise) {
			promise.catch(e => console.log(e));
		}
	}

	onTab(char, key) {
		this.rl.line = this.rl.line.replace(/\t/g, '');
		this.jumper.getBlock('commandDiv.input').content(this.rl.line);

		if (!key.shift) {
			this.rl.cursor -= 1;
		}

		this.jumper.chain().render().jumpTo('commandDiv.input', this.rl.cursor).execute();

		if (this.isPhase1) {
			return this.onTabPhase1(char, key);
		} else if (this.isPhase2) {
			return this.onTabPhase2(char, key);
		}
	}

	async onTabPhase1(char, key) {
		const [output] = await this.getOutputForCommand(this.rl.line);

		if (key.shift) {
			this.jumper.erase();
			await pager(wrapAnsi(output, getTermWidth(), { trim: false }));
		} else {
			this._populateOutputDiv(output);
		}

		this.jumper
			.chain()
			.render()
			.jumpTo('commandDiv.input', this.rl.cursor)
			.execute();
	}

	async onTabPhase2(char, key) {
		const division = this.jumper.getDivision('outputDiv');
		const block = division.getBlock('output');
		const selectedRow = this.selectingIdx + division.scrollPosY();

		const input = (() => {
			if (this.isSelecting) {
				return stripAnsi(block.getRow(selectedRow));
			} else {
				return this.input;
			}
		})();

		const [output] = await this.getOutputForCommand(this.rl.line, {
			cwd: this.cwd,
			input
		});

		if (output) {
			this.jumper.erase();
			await pager(output);
		}

		this.jumper.chain().render();

		if (this.isSelecting) {
			this.jumper
				.jumpTo('outputDiv.output', this.getIndicatorXPosition(selectedRow), selectedRow)
				.appendToChain(`   ${chalk.bold.blue('⬅')}`);
		}

		this.jumper.jumpTo('commandDiv.input', this.rl.cursor);
		this.jumper.execute();
	}

	async onMetaShiftArrow(char, key) {
		const outputDiv = this.jumper.getDivision('outputDiv');
		let [amountX, amountY] = [0, 0];

		if (key.name === 'left') {
			amountX = -1;
		} else if (key.name === 'right') {
			amountX = 1;
		} else if (key.name === 'up') {
			amountY = -1;
		} else if (key.name === 'down') {
			amountY = 1;
		}

		if (key.ctrl) {
			amountX *= outputDiv.width() / 2;
			amountY *= outputDiv.height() / 2;
		}

		outputDiv.scrollRight(amountX);
		outputDiv.scrollDown(amountY);

		this.jumper.chain().render();

		if (this.isSelecting) {
			const selectedRow = this.selectingIdx + outputDiv.scrollPosY();
			const indicatorXPos = this.getIndicatorXPosition(selectedRow);

			this.jumper
				.appendToChain(this.jumper.getDivision('indicatorEraseDiv').eraseString())
				.jumpTo('outputDiv.output', indicatorXPos, selectedRow)
				.appendToChain(`   ${chalk.bold.blue('⬅')}`);
		}

		this.jumper.jumpTo('commandDiv.input', this.rl.cursor);
		this.jumper.execute();
	}

	async onArrow(char, key) {
		if (['left', 'right'].includes(key.name)) {
			return;
		}
		if (!this.isPhase2 || (!this.isSelecting && key.name === 'up')) {
			return;
		}

		this.isSelecting = true;
		this.jumper.chain();

		const outputDiv = this.jumper.getDivision('outputDiv');

		// erase previous indicator
		if (this.selectingIdx >= 0) {
			const selectedRow = this.selectingIdx + outputDiv.scrollPosY();
			const indicatorXPos = this.getIndicatorXPosition(selectedRow);

			this.jumper
				.jumpTo('outputDiv.output', indicatorXPos, selectedRow)
				.jumpTo('outputDiv.output', indicatorXPos, selectedRow)
				.appendToChain('    ')
				.appendToChain(this.jumper.getDivision('indicatorEraseDiv').eraseString());
		}

		this.selectingIdx += key.name === 'up' ? -1 : 1;

		if (this.selectingIdx < 0 && outputDiv.scrollPosY() === 0) {
			// move back up to command prompt
			this.isSelecting = false;
			this.jumper.jumpTo('commandDiv.input', this.rl.cursor).execute();
			return;
		} else if (this.selectingIdx < 0) {
			// scroll up
			this.selectingIdx = 0;
			outputDiv.scrollUp(1);
			this.jumper.render();
		} else if (this.selectingIdx > outputDiv.height() - 1) {
			// scroll down
			outputDiv.scrollDown(1);
			this.jumper.render();
			this.selectingIdx = outputDiv.height() - 1;
		}

		const selectedRow = this.selectingIdx + outputDiv.scrollPosY();
		const indicatorXPos = this.getIndicatorXPosition(selectedRow);

		this.jumper
			.appendToChain(outputDiv.jumpToString('output', indicatorXPos, selectedRow))
			.appendToChain(`   ${chalk.bold.blue('⬅')}`)
			.jumpTo('commandDiv.input', this.rl.cursor)
			.execute();
	}

	getIndicatorXPosition(selectedRow) {
		const division = this.jumper.getDivision('outputDiv');
		const block = this.jumper.getBlock('outputDiv.output');
		const selectedRowWidth = block.getWidthOnRow(selectedRow);

		const position = Math.min(selectedRowWidth, division.width());
		return position + division.scrollPosX();
	}

	getOutputForCommand(command, options) {
		if ([':h', ':help'].includes(command.trim())) {
			return [helpScreen(), 0];
		} else if ([':c', ':controls'].includes(command.trim())) {
			return [controlsScreen(), 0];
		} else {
			return this.exec(command, options);
		}
	}

	/**
	 * @return {Promise<{ output: string, status: number, command: string }>}
	 */
	exec(commandString, options = {}) {
		return new Promise(resolve => {
			const isEscaped = ESCAPE_STRING_REGEX.exec(commandString);
			const isInteractive = INTERACTIVE_FLAG_REGEX.exec(commandString);

			if (options.input) {
				let input = options.input;

				if (isEscaped || this.config.alwaysEscapeInput) {
					// escape string and convert newlines to spaces
					input = input.replace(/\n/g, ' ').replace(/'/g, "''");
					input = execSync(`printf "%q" '${input}'`).toString();
				}

				commandString = commandString.replace('$1', input);
			}

			// deep clone options with default values
			const spawnOptions = Object.assign({}, {
				shell: true,
				stdio: isInteractive ? 'inherit' : null,
				cwd: options.cwd,
				env: Object.assign({}, process.env, {
					'FORCE_COLOR': this.config.FORCE_COLOR
				}, options.env)
			});

			// massage command input + custom functions to work with child_process's
			// spawn function. the first argument to spawn must be a command, but we
			// want to "load" the custom functions first so that they can run
			// properly.
			const spawnCommand = 'if';
			const prepend = 'true; then :; fi;';
			const fullCommand = `${prepend}${this.customFunctions}\n${commandString}`;

			const child = spawnSync(spawnCommand, [fullCommand], spawnOptions);

			if (!child.stdout && !child.stderr) {
				return resolve(['', 0, commandString]);
			}

			const [stderr, stdout] = [child.stderr.toString(), child.stdout.toString()];
			const output = stderr ? chalk.red(stderr) : stdout;

			resolve([output, stderr ? 1 : 0, commandString]);
		});
	}

	onEarlyExit() {
		this.jumper.erase();
		this.rl.close();

		process.exit(1);
	}
}

module.exports = PipeBoy;
