#!/usr/bin/env node

const { homedir } = require('os');
const { existsSync } = require('fs');
const { join } = require('path');
const { exec } = require('child_process');
const { createInterface } = require('readline');
const chalk = require('chalk');

const SOURCE_CONFIG = join(__dirname, '../.pipe-boy/');
const DESTINATION_CONFIG = `${homedir()}/.pipe-boy/`;

function copy() {
	exec(`cp -R ${SOURCE_CONFIG} ${DESTINATION_CONFIG}`, (error, stdout, stderr) => {
		if (error) {
			throw new Error(error);
		}

		console.log(`Initializing default config under ${chalk.bold(DESTINATION_CONFIG)}.`);
	});
}

if (existsSync(DESTINATION_CONFIG)) {
	process.exit(0);
}

if (process.argv.slice(2)[0] === '--postinstall') {
	const rl = createInterface({
		input: process.stdin,
		output: process.stdout
	});

	rl.question(`This package reads information from configuration values under ${chalk.bold(DESTINATION_CONFIG)}. Do you want to create one with default values now? (y/N) > `, answer => {
		if (['y', 'Y'].includes(answer.trim()[0])) {
			copy();
		}

		rl.close();
	});
} else {
	copy();
}
