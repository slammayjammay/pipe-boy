const { homedir } = require('os');
const { existsSync } = require('fs');
const { join } = require('path');
const { exec, fork } = require('child_process');
const editJsonFile = require('edit-json-file');
const chalk = require('chalk');

const CONFIG_DIR_PATH = `${homedir()}/.pipe-boy/`;
const DEFAULT_CONFIG_DIR_PATH = join(__dirname, '../.pipe-boy/');

class ConfigManager {
	constructor(args = [], screen) {
		this.args = args;
		this.screen = screen;

		const action = this.args._[1];
		const actionArgs = this.args._.slice(2);

		if (!action || action === 'help' || this.args.help) {
			this.printHelpScreen();
			return;
		}

		if (!existsSync(CONFIG_DIR_PATH)) {
			this.warnNoConfig();
			return;
		}

		this.config = editJsonFile(join(CONFIG_DIR_PATH, 'config.json'));
		this.defaultConfig = editJsonFile(join(DEFAULT_CONFIG_DIR_PATH, 'config.json'));

		if (action === 'get') {
			this.get(actionArgs);
		} else if (action === 'set') {
			this.set(actionArgs);
		} else if (action === 'delete') {
			this.delete(actionArgs);
		} else if (action === 'reset') {
			this.reset(actionArgs);
		} else if (action === 'check') {
			this.checkForDirtyConfig();
		} else if (action === 'destroy') {
			this.destroy();
		} else if (action === 'path') {
			this.path();
		}
	}

	printHelpScreen() {
		console.log(this.screen.config());
	}

	warnNoConfig() {
		const rl = this._createInterface();

		const question = `Config folder ${chalk.bold(CONFIG_DIR_PATH)} not found. Do you want to create one? (y/N) > `;
		rl.question(question, answer => {
			if (['y', 'Y'].includes(answer.trim()[0])) {
				fork(join(__dirname, '../scripts/copy-config'));
			}

			rl.close();
		});
	}

	get(args) {
		if (args.length === 0) {
			console.log(JSON.stringify(this.config.get(), null, 2));
			return;
		}

		while (args.length > 0) {
			const key = args.shift();
			const value = this.config.get(key);

			if (value === undefined) {
				console.log(`Key ${chalk.green(key)} not found.`);
			} else {
				console.log(`${chalk.green(key)} =>`, chalk.green(JSON.stringify(value, null, 2)));
			}
		}
	}

	set(args) {
		while (args.length > 0) {
			const key = args.shift();
			if (key === undefined) {
				console.log('No key specified.');
				return;
			}

			const value = this._parse(key, args.shift());
			if (value === undefined) {
				console.log(`Missing value for key ${chalk.green(key)}.`);
				return;
			}

			this.config.set(key, value);
			console.log(`Setting config entry ${chalk.green(key)} => ${chalk.green(value)}.`);
		}

		this.config.save();
	}

	delete(args) {
		if (args.length === 0) {
			console.log('No key specified.');
			return;
		}

		while (args.length > 0) {
			const key = args.shift();

			const namespaces = key.split('.');
			const lastKey = namespaces.pop();

			const obj = this.config.get(namespaces.join('.'));

			if (obj === undefined) {
				console.log(`No key ${chalk.green(key)} found. Skipping.`);
				continue;
			}

			delete obj[lastKey];
			console.log(`Deleting key ${chalk.green(key)}.`);
		}

		this.config.save();
	}

	reset(args) {
		if (args.length === 0) {
			this.config.data = {};

			Object.keys(this.defaultConfig.get()).forEach(key => {
				this.config.set(key, this.defaultConfig.get(key));
			});
			console.log('Resetting back to default configuration.');
		} else {
			args.forEach(key => {
				const defaultValue = this.defaultConfig.get(key);

				if (defaultValue !== undefined) {
					this.config.set(key, null); // hmm...
					this.config.set(key, defaultValue);
					console.log(`Resetting key ${chalk.green(key)} to default value.`);
				} else {
					console.log(`Config key ${chalk.green(key)} has no default value.`);
				}
			});
		}

		this.config.save();
	}

	checkForDirtyConfig() {
		const dirtyKeys = Object.keys(this.config.get()).map(key => {
			if (this.defaultConfig.get(key) === undefined) {
				return key;
			}
		}).filter(el => el !== undefined);

		if (dirtyKeys.length === 0) {
			console.log('Config file looks good.');
			return;
		}

		const dirtyKeysString = dirtyKeys.map(str => `"${str}"`).join('\n');
		const rl = this._createInterface();

		let question = `The following config keys are not recognized and will not be used.\n`;
		question += dirtyKeys.map(str => `    "${str}"`).join('\n');
		question += `\nDo you want to remove them? (y/N) > `;

		rl.question(question, answer => {
			if (['y', 'Y'].includes(answer.trim()[0])) {
				this.delete(dirtyKeys);
				this.config.save();
			} else {
				console.log('Skipping.');
			}

			rl.close();
		});
	}

	destroy() {
		const rl = this._createInterface();

		const question = `Are you sure you want to delete ${chalk.bold(CONFIG_DIR_PATH)}? (y/N) > `;
		rl.question(question, answer => {
			if (['y', 'Y'].includes(answer.trim()[0])) {
				exec(`rm -rf ${CONFIG_DIR_PATH}`, (error, stdout, stderr) => {
					if (error || stderr) {
						console.log(error || stderr);
					} else {
						console.log(`Deleting ${chalk.bold(CONFIG_DIR_PATH)}.`);
					}
				});
			}

			rl.close();
		});
	}

	path() {
		let path = CONFIG_DIR_PATH;

		if (this.args.config) {
			path += 'config.json';
		} else if (this.args.functions) {
			path += 'functions.sh';
		}

		console.log(path);
	}

	_createInterface() {
		return require('readline').createInterface({
			input: process.stdin,
			output: process.stdout,
			prompt: '',
			historySize: 0
		});
	}

	_parse(key, value) {
		// env variable 'FORCE_COLOR' must be set as 0 or 1
		if (key === 'FORCE_COLOR') {
			if (['true', '1'].includes(value)) return 1;
			if (['false', '0'].includes(value)) return 0;
		}

		return value;
	}
}

module.exports = ConfigManager;
