const { homedir } = require('os');
const { readFileSync } = require('fs');
const { exec } = require('child_process');
const readline = require('readline');
const chalk = require('chalk');
const sliceAnsi = require('slice-ansi');
const { cursorShow, cursorHide, eraseLine } = require('ansi-escapes');
const jumper = require('terminal-jumper');
const pager = require('node-pager');
require('./readline-hack');

const CONFIG_DIR_PATH = `${homedir()}/.pipe-boy/`;
const TAB_NUM_SPACES = 8;
const TAB_FAKER = new Array(TAB_NUM_SPACES).join(' ');

class PipeBoy {
	constructor(input = '') {
		this.input = input.replace(/\t/g, TAB_FAKER);

		this.onKeypress = this.onKeypress.bind(this);
		this.onExit = this.onExit.bind(this);

		this.isPhase1 = false;
		this.isPhase2 = false;
		this.phase1Command = '';
		this.isSelecting = false;
		this.selectingIdx = -1;
		this.scrollIdx = 0;
		this.isDone = false;

		if (this.input) {
			this.isPhase2 = true;
		} else {
			this.isPhase1 = true;
		}

		this.begin();
	}

	begin() {
		process.on('exit', this.onExit);
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

		this.setJumperTemplate();

		if (this.isPhase1) {
			this.phase1();
		} else if (this.isPhase2) {
			this.phase2();
		}
	}

	readCustomFunctions() {
		return readFileSync(`${CONFIG_DIR_PATH}/functions.sh`).toString();
	}

	setJumperTemplate() {
		jumper.block('', 'info-block');
		jumper.block('', 'command-prompt');
		jumper.block('', 'command-input');
		jumper.block('', 'newline');
		jumper.block(new Array(Math.min(process.stdout.columns, 70)).join('='), 'divider');
	}

	async phase1() {
		this.setInfoBlock();
		jumper.find('command-prompt').content(`Command ${chalk.cyan(1)}`);
		this.render();
		jumper.jumpTo('command-input', -1);

		const command = await new Promise(resolve => {
			const that = this;

			this.rl.on('line', function onLine(line) {
				if (line.trim() !== '') {
					that.rl.removeListener('line', onLine);
					resolve(line);
				} else {
					that.setCommandOutput(chalk.red('Please enter a command'));
					this.render();
					jumper.jumpTo('command-input', -1);
				}
			});
		});

		const output = await this.exec(command);

		this.input = output.trim().replace(/\t/g, TAB_FAKER);
		this.phase1Command = command;
		this.isPhase1 = false;
		this.isPhase2 = true;

		this.phase2();
	}

	async phase2() {
		this.rl.line = '';
		this.rl.cursor = this.rl.line.length;

		this.setInfoBlock();
		jumper.find('command-prompt').content(`Command ${chalk.cyan(2)}`);
		jumper.find('command-input').content(this.rl.line);
		this.setCommandOutput(this.input);
		this.render();
		jumper.jumpTo('command-input', -1);

		let command = await new Promise(resolve => {
			this.rl.once('line', line => {
				resolve(line);
			});
		});

		if (command.trim() === ':back') {
			jumper.removeAllMatching(/command-output-\d/);
			jumper.find('command-input').content(this.phase1Command);
			this.rl.line = this.phase1Command;
			this.rl.cursor = this.rl.line.length;
			this.isPhase1 = true;
			this.isPhase2 = false;
			this.isSelecting = false;
			this.selectingIdx = -1;
			this.scrollIdx = 0;
			this.phase1();
			return;
		}

		const input = (() => {
			if (this.isSelecting) {
				return jumper.find(`command-output-${this.selectingIdx}`).escapedText;
			} else {
				return this.input;
			}
		})();

		command = command.replace('$1', input);
		const output = await this.exec(command);

		jumper.reset();
		jumper.block(chalk.cyan(`$ ${command}`));
		jumper.break();
		jumper.block(new Array(Math.min(process.stdout.columns, 70)).join('='), 'divider');
		jumper.break();
		jumper.block(output);
		this.render();

		this.isDone = true;
		process.exit(0);
	}


	setInfoBlock() {
		let infoBlock = `${chalk.bold.green('PipeBoy')}\n`;
		infoBlock += `${chalk.gray(new Array(40).join('-'))}\n`;

		if (this.isPhase1) {
			infoBlock += chalk.gray(`Press ${chalk.yellow('tab')} or ${chalk.yellow('shift+tab')} to preview\n`);
			infoBlock += chalk.gray(`Press ${chalk.yellow('enter')} to confirm\n`);
			infoBlock += chalk.gray(`Pass ${chalk.cyan('--help')} or ${chalk.cyan('-h')} for more info\n`);
		} else if (this.isPhase2) {
			infoBlock += chalk.gray(`Use ${chalk.yellow('arrow keys')} to navigate\n`);
			infoBlock += chalk.gray(`Press ${chalk.yellow('tab')} to preview\n`);
			infoBlock += chalk.gray(`Press ${chalk.yellow('enter')} to confirm\n`);
			infoBlock += chalk.gray(`Keywords:\n`);
			infoBlock += chalk.gray(`  ${chalk.bold.green('$1')} -- input from previous command\n`);
			infoBlock += chalk.gray(`  ${chalk.bold.green(':back')} -- go back to previous step\n`);
		}

		infoBlock += `${chalk.gray(new Array(40).join('-'))}\n`;

		jumper.find('info-block').content(infoBlock);
	}

	setCommandOutput(string) {
		this.commandOutput = this.splitOutputIntoLines(string);

		const availableOutputHeight = this.getAvailableOutputHeight();
		const length = Math.min(availableOutputHeight, this.commandOutput.length);

		jumper.removeAllMatching(/command-output-\d/);

		for (let i = 0; i < length; i++) {
			jumper.block(this.commandOutput[i], `command-output-${i}`);
		}
	}

	getAvailableOutputHeight() {
		let height = 0;
		const ids = ['info-block', 'command-prompt', 'command-input', 'newline', 'divider'];
		ids.forEach(id => height += jumper.find(id).height());

		return process.stdout.rows - height - 3;
	}

	splitOutputIntoLines(string) {
		const lines = string.trim().split('\n');

		const maxWidth = process.stdout.columns - 5;

		let i = 0;
		while (i < lines.length) {
			const line = lines[i];
			const truncated = sliceAnsi(line, 0, maxWidth);

			if (truncated.length < line.length) {
				lines[i] = sliceAnsi(line, maxWidth);
				lines.splice(i, 0, truncated);
			}

			i += 1;
		}

		return lines;
	}

	onKeypress(char, key) {
		if (key.name === 'tab') {
			this.onTab(char, key);
		} else if (['up', 'down'].includes(key.name)) {
			this.onArrow(char, key);
		} else if (key.name !== 'return') {
			jumper.find('command-input').content(this.rl.line);
		}
	}

	async onTab(char, key) {
		this.rl.line = this.rl.line.replace(/\t/g, '');
		this.rl.cursor = this.rl.line.length;
		jumper.find('command-input').content(this.rl.line);

		if (this.rl.line.trim() === '') {
			return;
		}

		if (this.isPhase1) {
			await this.onTabPhase1(char, key);
		} else if (this.isPhase2) {
			await this.onTabPhase2(char, key);
		}
	}

	async onTabPhase1(char, key) {
		const output = await this.exec(this.rl.line);

		if (key.shift || output.split('\n').length > this.getAvailableOutputHeight()) {
			jumper.erase();
			await pager(output);
		} else {
			this.setCommandOutput(output);
		}

		this.render();
		jumper.jumpTo('command-input', -1);
		return Promise.resolve();
	}

	async onTabPhase2(char, key) {
		const cmd = this.rl.line;
		const str = (() => {
			if (this.isSelecting) {
				return jumper.find(`command-output-${this.selectingIdx}`).escapedText;
			} else {
				return this.input;
			}
		})();

		const command = this.rl.line.replace('$1', str);
		const output = await this.exec(command);

		jumper.erase();
		await pager(output);
		this.render();

		if (this.isSelecting) {
			jumper.jumpTo(`command-output-${this.selectingIdx}`, -1);
			process.stdout.write(`   ${chalk.bold.blue('⬅')}`);
		}

		jumper.jumpTo('command-input', -1);
		return Promise.resolve();
	}

	onArrow(char, key) {
		if (!this.isPhase2 || (!this.isSelecting && key.name === 'up')) {
			return;
		}
		this.isSelecting = true;

		if (key.name === 'down' && this.selectingIdx === jumper.findAllMatching(/command-output-\d/).length - 1) {
			this.scrollOutput(1);
			return;
		} else if (key.name === 'up' && this.scrollIdx > 0 && this.selectingIdx === 0) {
			this.scrollOutput(-1);
			return;
		}

		if (this.selectingIdx >= 0) {
			jumper.jumpTo(`command-output-${this.selectingIdx}`, -1);
			process.stdout.write('    ');
		}

		this.selectingIdx += key.name === 'up' ? -1 : 1;

		if (this.selectingIdx < 0 && this.scrollIdx === 0) {
			this.isSelecting = false;
			jumper.jumpTo('command-input', -1);
			return;
		}

		jumper.jumpTo(`command-output-${this.selectingIdx}`, -1);
		process.stdout.write(`   ${chalk.bold.blue('⬅')}`);

		jumper.jumpTo('command-input', -1);
	}

	scrollOutput(dir) {
		const numLines = jumper.findAllMatching(/command-output-\d/).length;
		const endScrollIdx = this.commandOutput.length - numLines;

		if (this.scrollIdx + dir < 0 || this.scrollIdx + dir > endScrollIdx) {
			return;
		}
		this.scrollIdx += dir;

		const lines = this.commandOutput.slice(this.scrollIdx, this.scrollIdx + numLines);

		// avoid a full jumper.render() by printing each line manually
		jumper.jumpTo('command-output-0');
		for (let i = 0; i < numLines; i++) {
			jumper.find(`command-output-${i}`).content(lines[i]);
			process.stdout.write(eraseLine + lines[i] + '\n')
		}

		jumper.jumpTo(`command-output-${this.selectingIdx}`, -1);
		process.stdout.write(`   ${chalk.bold.blue('⬅')}`);
		jumper.jumpTo('command-input', -1);
	}

	render() {
		process.stdout.write(cursorHide);
		jumper.render();
		process.stdout.write(cursorShow);
	}

	exec(command) {
		return new Promise(resolve => {
			if (this.customFunctions) {
				command = this.customFunctions + command;
			}

			const options = {
				env: Object.assign({}, process.env, {
					'FORCE_COLOR': this.config.FORCE_COLOR
				})
			};

			exec(command, options, (error, stdout, stderr) => {
				const output = stderr ? chalk.red(stderr) : stdout;
				resolve(output);
			});
		});
	}

	onExit() {
		if (!this.isDone) {
			jumper.erase();
		}

		this.rl.close();
		process.exit(0);
	}
}

module.exports = PipeBoy;
