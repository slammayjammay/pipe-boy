/**
 * The behavior for readline.createInterface's backspace functionality is not
 * good, at least for this project. On each backspace, _refreshLine is called
 * which actually clears all output beneath the current line, as well as the
 * current line itself. This hack redefines the _refreshLine method and
 * substitutes clearing all output beneath with just a simple clearLine().
 */

const readline = require('readline');

/**
 * copy pasted from https://github.com/nodejs/node/blob/master/lib/readline.js#L271-L309
 * The variable `exports` has been renamed to `readline`
 */
readline.Interface.prototype._refreshLine = function() {
  // line length
  var line = this._prompt + this.line;
  var dispPos = this._getDisplayPos(line);
  var lineCols = dispPos.cols;
  var lineRows = dispPos.rows;

  // cursor position
  var cursorPos = this._getCursorPos();

  // first move to the bottom of the current line, based on cursor pos
  var prevRows = this.prevRows || 0;
  if (prevRows > 0) {
    readline.moveCursor(this.output, 0, -prevRows);
  }

  // Cursor to left edge.
  readline.cursorTo(this.output, 0);
  // erase data
  // readline.clearScreenDown(this.output); // <-- Substitute this line
	readline.clearLine(this.output, 1)     // <-- with this one.

  // Write the prompt and the current buffer content.
  this._writeToOutput(line);

  // Force terminal to allocate a new line
  if (lineCols === 0) {
    this._writeToOutput(' ');
  }

  // Move cursor to original position.
  readline.cursorTo(this.output, cursorPos.cols);

  var diff = lineRows - cursorPos.rows;
  if (diff > 0) {
    readline.moveCursor(this.output, 0, -diff);
  }

  this.prevRows = cursorPos.rows;
};

