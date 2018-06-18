const { execSync } = require('child_process');

module.exports = () => {
	if (process.stdout.columns !== undefined) {
		return process.stdout.columns;
	} else {
		return parseInt(execSync('tput cols').toString());
	}
};
