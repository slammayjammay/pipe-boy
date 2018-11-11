const { execSync } = require('child_process');

module.exports = () => {
	if (process.stdout.columns !== undefined) {
		return process.stdout.columns - 1;
	} else {
		return parseInt(execSync('tput cols').toString() - 1);
	}
};
