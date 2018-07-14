const { homedir } = require('os');
const { readFileSync } = require('fs');
const { exec } = require('child_process');
const readline = require('readline');
const chalk = require('chalk');
const ansiEscapes = require('ansi-escapes');
const sliceAnsi = require('slice-ansi');
const stripAnsi = require('strip-ansi');
const TerminalJumper = require('terminal-jumper');
const pager = require('node-pager');
require('./readline-hack');

const CONFIG_DIR_PATH = `${homedir()}/.pipe-boy/`;
const TAB_NUM_SPACES = 8;
const TAB_FAKER = new Array(TAB_NUM_SPACES).join(' ');

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
		this.scrollIdx = 0;

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

		try {
			this.config = require(`${CONFIG_DIR_PATH}/config.json`);
		} catch (e) {
			this.config = {};
		}

		this.customFunctions = this.readCustomFunctions();

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

	readCustomFunctions() {
		return readFileSync(`${CONFIG_DIR_PATH}/functions.sh`).toString();
	}

	_createTerminalJumper() {
		const headerDiv = {
			id: 'headerDiv',
			top: 0,
			left: 0,
			width: 0.5
		};

		const infoDiv = {
			id: 'infoDiv',
			left: headerDiv.id,
			top: 0,
			width: 0.4
		};

		const commandDiv = {
			id: 'commandDiv',
			left: 0,
			top: headerDiv.id,
			width: 0.5
		};

		const outputDiv = {
			id: 'outputDiv',
			left: 0,
			top: commandDiv.id,
			width: 1,
			overflowX: 'wrap'
		};

		const debugDiv = {
			id: 'debugger',
			width: 0.3,
			left: 0.7,
			top: 0.5
		};

		return new TerminalJumper({
			divisions: [headerDiv, infoDiv, commandDiv, outputDiv],
			debug: DEBUG ? debugDiv : false
		});
	}

	_createJumperTemplate() {
		const banner = [
			' ______ __               ______                ',
			'|   __ \\__|.-----.-----.|   __ \\.-----.--.--.',
			'|    __/  ||  _  |  -__||   __ <|  _  |  |  |',
			'|___|  |__||   __|_____||______/|_____|___  |',
			'           |__|                       |_____|'
		];

		this.jumper.addBlock(`headerDiv.header`, chalk.green(banner.join('\n')));
		this.jumper.addBlock(`headerDiv`);
		const headerWidth = this.jumper.getDivision('headerDiv').width();

		this.jumper.addBlock('commandDiv');
		this.jumper.addBlock('commandDiv.prompt');
		this.jumper.addBlock('commandDiv.input');
		this.jumper.addBlock('commandDiv');
		this.jumper.addBlock('commandDiv.divider');
		this.jumper.addBlock('outputDiv.output');
	}

	async phase1() {
		this.setInfoBlock();

		this.jumper.getBlock('commandDiv.prompt').content(`Command ${chalk.cyan(1)}`);
		this.jumper.getBlock('commandDiv.divider').content(
			new Array(this.jumper.getDivision('outputDiv').width()).join('=')
		);

		this.jumper
			.chain()
			.render()
			.jumpTo('commandDiv.input', -1)
			.execute();

		const command = await new Promise(resolve => {
			const that = this;

			this.rl.on('line', function onLine(line) {
				if (line.trim() !== '') {
					that.rl.removeListener('line', onLine);
					resolve(line);
				} else {
					that.jumper.block('outputDiv.output').content(chalk.red('Please enter a command'));
					that.jumper
						.chain()
						.render()
						.jumpTo('commandDiv.input', -1)
						.execute();
				}
			});
		});

		if (this.config.setCwdOnCd) {
			this.cwd = this.parseCwdOnCd(command);
		}

		const [output] = await this.exec(command);

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

		this.setInfoBlock();
		this.jumper.getBlock('commandDiv.prompt').content(`Command ${chalk.cyan(2)}`);
		this.jumper.getBlock('commandDiv.input').content(this.rl.line);
		this.jumper.getBlock('outputDiv.output').content(this.input);

		this.jumper
			.chain()
			.render()
			.jumpTo('commandDiv.input', -1)
			.execute();

		let command = await new Promise(resolve => {
			this.rl.once('line', line => resolve(line));
		});

		if (command.trim() === ':back') {
			this.jumper.getBlock('outputDiv.output').content('');
			this.jumper.getBlock('commandDiv.input').content(this.phase1Command);
			this.rl.line = this.phase1Command;
			this.rl.cursor = this.rl.line.length;
			this.isPhase1 = true;
			this.isPhase2 = false;
			this.cwd = null;
			this.isSelecting = false;
			this.selectingIdx = -1;
			this.scrollIdx = 0;
			return this.phase1();
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

		command = command.replace('$1', input);
		const [output, status] = await this.exec(command, { cwd: this.cwd });

		console.log(chalk.cyan(`$ ${command}`));
		console.log();
		console.log(new Array(process.stdout.columns).join('='));
		console.log();

		return Promise.resolve([output, status]);
	}

	setInfoBlock() {
		if (!this.jumper.hasBlock('infoDiv.info')) {
			this.jumper.addBlock('infoDiv.info');
		}

		const borderWidth = ~~(this.jumper.getDivision('infoDiv').width());
		const borderTop = chalk.gray(`┏${new Array(borderWidth - 1).join('━')}┓`);

		let lines = [];

		if (this.isPhase1) {
			lines.push(chalk.gray(`${chalk.yellow('tab')} or ${chalk.yellow('shift+tab')} to preview`));
			lines.push(chalk.gray(`${chalk.yellow('enter')} to confirm`));
			lines.push(chalk.gray(`${chalk.cyan('--help')} or ${chalk.cyan('-h')} for more info`));
		} else if (this.isPhase2) {
			lines.push(chalk.gray(`${chalk.yellow('arrow keys')} to navigate`));
			lines.push(chalk.gray(`${chalk.yellow('tab')} to preview`));
			lines.push(chalk.gray(`${chalk.yellow('enter')} to confirm`));
			lines.push(chalk.gray(`${chalk.bold.green('$1')} -- input from previous command`));
			lines.push(chalk.gray(`${chalk.bold.green(':back')} -- go back to previous step`));
		}

		lines = lines.map(line => {
			line = `${chalk.gray('┃')}  ${line}`;
			const length = stripAnsi(line).length;
			line += new Array(borderWidth - length).join(' ') + chalk.gray('┃');
			return line;
		});

		const borderBottom = chalk.gray(`┗${new Array(borderWidth - 1).join('━')}┛`);

		this.jumper.getBlock('infoDiv.info').content(
			[borderTop, ...lines, borderBottom].join('\n')
		);
	}

	onKeypress(char, key) {
		if (key.name === 'tab') {
			this.onTab(char, key);
		} else if (['up', 'down'].includes(key.name)) {
			this.onArrow(char, key);
		} else if (key.name !== 'return') {
			this.jumper.getBlock('commandDiv.input').content(this.rl.line);
		}
	}

	async onTab(char, key) {
		this.rl.line = this.rl.line.replace(/\t/g, '');
		this.rl.cursor -= 1;
		this.jumper.getBlock('commandDiv.input').content(this.rl.line);

		if (this.rl.line.trim() === '') {
			return;
		}

		this.jumper.chain().render().jumpTo('commandDiv.input', this.rl.cursor).execute();

		if (this.isPhase1) {
			await this.onTabPhase1(char, key);
		} else if (this.isPhase2) {
			await this.onTabPhase2(char, key);
		}
	}

	async onTabPhase1(char, key) {
		const [output] = await this.exec(this.rl.line);

		const division = this.jumper.getDivision('outputDiv');
		const block = division.getBlock('output');
		const previousText = block.text;

		block.content(output);

		if (key.shift || block.height() > division.height()) {
			this.jumper.erase();
			await pager(block.text);
			block.content(previousText);
		}

		this.jumper
			.chain()
			.render()
			.jumpTo('commandDiv.input', this.rl.cursor)
			.execute()

		return Promise.resolve();
	}

	async onTabPhase2(char, key) {
		const division = this.jumper.getDivision('outputDiv');
		const block = division.getBlock('output');
		const selectedRow = this.selectingIdx + division.scrollPosY();

		const cmd = this.rl.line;
		const str = (() => {
			if (this.isSelecting) {
				return stripAnsi(block.getRow(selectedRow));
			} else {
				return this.input;
			}
		})();

		const command = this.rl.line.replace('$1', str);
		const [output] = await this.exec(command, { cwd: this.cwd });

		this.jumper.erase();
		await pager(output);

		this.jumper.chain().render();
		if (this.isSelecting) {
			this.jumper
				.jumpTo('outputDiv.output', -1, selectedRow)
				.appendToChain(`   ${chalk.bold.blue('⬅')}`);
		}
		this.jumper.jumpTo('commandDiv.input', -1);
		this.jumper.execute();

		return Promise.resolve();
	}

	onArrow(char, key) {
		if (!this.isPhase2 || (!this.isSelecting && key.name === 'up')) {
			return;
		}
		this.isSelecting = true;

		const division = this.jumper.getDivision('outputDiv');

		const outputDivHeight = division.height() - 1;
		const outputBlockHeight = division.getBlock('output').height() - 1;
		const isOutputOverflowing = outputBlockHeight > outputDivHeight;

		if (isOutputOverflowing) {
			if (key.name === 'down' && this.selectingIdx === outputDivHeight) {
				this.scrollOutputDown();
				return;
			} else if (key.name === 'up' && this.selectingIdx === 0) {
				this.scrollOutputUp();
				return;
			}
		}

		let writeString = '';

		// erase previous indicator
		if (this.selectingIdx >= 0) {
			const row = this.selectingIdx + division.scrollPosY();
			writeString += this.jumper.jumpToString('outputDiv.output', -1, row);
			writeString += '    ';
		}

		this.selectingIdx += key.name === 'up' ? -1 : 1;

		// move back up to command prompt
		if (this.selectingIdx < 0 && this.scrollIdx === 0) {
			this.isSelecting = false;
			writeString += this.jumper.jumpToString('commandDiv.input', -1);
			process.stdout.write(writeString);
			return;
		}

		if (this.selectingIdx > outputBlockHeight) {
			this.selectingIdx = outputBlockHeight;
		}

		writeString += division.jumpToString('output', -1, this.selectingIdx + division.scrollPosY());
		writeString += `   ${chalk.bold.blue('⬅')}`;
		writeString += this.jumper.jumpToString('commandDiv.input', -1);

		process.stdout.write(writeString);
	}

	scrollOutputDown() {
		const division = this.jumper.getDivision('outputDiv');
		const block = this.jumper.getBlock('outputDiv.output');

		this.jumper.scrollDown('outputDiv', 1);
		this.scrollIdx = division.scrollPosY();

		const lastRow = division.height() - 1 + division.scrollPosY();
		const lastRowWidth = block.getWidthOnRow(lastRow);

		this.jumper.chain()
			.render()
			.jumpTo('outputDiv', lastRowWidth, -1)
			.appendToChain(`   ${chalk.bold.blue('⬅')}`)
			.jumpTo('commandDiv.input')
			.execute();
	}

	scrollOutputUp() {
		const division = this.jumper.getDivision('outputDiv');
		const block = this.jumper.getBlock('outputDiv.output');

		if (this.scrollIdx === 0) {
			return;
		}
		this.scrollIdx -= 1;

		this.jumper.chain()
			.scrollUp('outputDiv', 1)
			.render()
			.jumpTo('outputDiv.output', -1, division.scrollPosY())
			.appendToChain(`   ${chalk.bold.blue('⬅')}`)
			.jumpTo('commandDiv.input')
			.execute();
	}

	render(options = {}) {
		let writeString = '';
		writeString += ansiEscapes.cursorHide;
		writeString += this.jumper.renderString();
		writeString += ansiEscapes.cursorShow;

		if (options.writeToTerminal) {
			process.stdout.write(writeString);
		} else {
			return writeString;
		}
	}

	exec(command, options = {}) {
		return new Promise(resolve => {
			if (this.customFunctions) {
				command = this.customFunctions + command;
			}

			options.env = Object.assign({}, process.env, {
				'FORCE_COLOR': this.config.FORCE_COLOR
			}, options.env);

			exec(command, options, (error, stdout, stderr) => {
				const output = stderr ? chalk.red(stderr) : stdout;
				resolve([output, (error || stderr) ? 1 : 0]);
			});
		});
	}

	onEarlyExit() {
		this.jumper.erase();
		this.rl.close();

		process.exit(1);
	}
}

module.exports = PipeBoy;
