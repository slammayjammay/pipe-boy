#!/usr/bin/env node

const { homedir } = require('os');
const { readFileSync } = require('fs');
const { join } = require('path');
const minimist = require('minimist');
const deepmerge = require('deepmerge');
const ConfigManager = require('../src/ConfigManager');
const PipeBoy = require('../src/PipeBoy');
const Screen = require('../src/Screen');
const packageJson = require(join(__dirname, '../package.json'));

const args = minimist(process.argv.slice(2), {
	alias: {
		c: 'controls',
		h: 'help',
		v: 'version'
	}
});

const USER_CONFIG_DIR_PATH = `${homedir()}/.pipe-boy/`;
const DEFAULT_CONFIG_DIR_PATH = join(__dirname, '../.pipe-boy/');

function getConfig() {
	// merge default config with user config and runtime options
	const defaultConfig = require(join(DEFAULT_CONFIG_DIR_PATH, 'config.json'));
	const userConfig = (() => {
		try {
			return require(join(USER_CONFIG_DIR_PATH, 'config.json'));
		} catch(e) {
			return {};
		}
	})();

	const runtimeOptions = Object.assign({}, args);
	delete runtimeOptions._;

	return deepmerge.all([defaultConfig, userConfig, runtimeOptions]);
}

function getCustomFunctions() {
	try {
		return readFileSync(join(USER_CONFIG_DIR_PATH, 'functions.sh')).toString();
	} catch(e) {
		return '';
	}
}

const screen = new Screen();

if (args.config || args._[0] === 'config') {
	new ConfigManager(args, screen);
} else if (args.help || args._[0] === 'help') {
	console.log(screen.help());
} else if (args.controls || args._[0] === 'controls') {
	console.log(screen.controls());
} else if (args.version || args._[0] === 'version') {
	console.log(packageJson.version);
} else {
	try {
		const pipeBoy = new PipeBoy(
			args._.join('\n'),
			getConfig(),
			getCustomFunctions(),
			screen
		);

		pipeBoy.catch(e => {
				console.log(e);
				process.exit(1);
			})
			.then(([output, status]) => {
				console.log(output);
				process.exit(status);
			});

	} catch(e) {
		console.log(e);
		process.exit(1);
	}
}
