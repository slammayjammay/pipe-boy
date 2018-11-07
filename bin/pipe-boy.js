#!/usr/bin/env node

const { join } = require('path');
const minimist = require('minimist');
const wrapAnsi = require('wrap-ansi');
const ConfigManager = require('../src/ConfigManager');
const PipeBoy = require('../src/PipeBoy');
const getTermWidth = require('../src/get-term-width');
const packageJson = require(join(__dirname, '../package.json'));
const getHelpString = require('../src/get-help-string');
const getControlsString = require('../src/get-controls-string');

const args = minimist(process.argv.slice(2), {
	alias: {
		h: 'help',
		c: 'controls',
		v: 'version'
	}
});

if (args._[0] === 'config') {
	new ConfigManager(args);
} else if (args.help || args._[0] === 'help') {
	console.log(wrapAnsi(getHelpString(), getTermWidth() - 1, { trim: false }));
} else if (args.controls || args._[0] === 'controls') {
	console.log(wrapAnsi(getControlsString(), getTermWidth() - 1, { trim: false }));
} else if (args.version) {
	console.log(packageJson.version);
} else {
	try {
		new PipeBoy(process.argv.slice(2).join('\n'))
			.catch(e => {
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
