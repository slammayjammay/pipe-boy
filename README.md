# `pipe-boy`
> Interactive CLI to pass output from one command as input to another

Node 7+ required!

```sh
$ npm install --global pipe-boy
```

## Demos
Example of previewing output from several different commands

![phase 1](https://user-images.githubusercontent.com/11801881/42720421-9181add4-86db-11e8-9371-4bf60fa808eb.gif)

Example of chaining two commands together

![phase 2](https://user-images.githubusercontent.com/11801881/42720426-963bfc08-86db-11e8-9669-d5e4cfb2a2c5.gif)

Example of setting up custom functions

![custom functions](https://user-images.githubusercontent.com/11801881/42720423-93e07466-86db-11e8-8449-3f4a405064e1.gif)

Example of running command (vim) inheriting terminal stdio

![vim](https://user-images.githubusercontent.com/11801881/48382554-70fe5880-e696-11e8-9175-961ce933093d.gif)

## Help screen
```
$ pipe-boy --help
 ______ __               ______
|   __ \__|.-----.-----.|   __ \.-----.--.--.
|    __/  ||  _  |  -__||   __ <|  _  |  |  |
|___|  |__||   __|_____||______/|_____|___  |
           |__|                       |_____|

DESCRIPTION
     This command allows you to take output from one command, modify it, then
use it as input into another command.

PROCESS
     Phase 1) If no arguments are passed, this phase is entered and you are
prompted to enter a command. The output of this command will be used as input
for the next. You can preview this output by pressing tab to preview on-screen,
or shift+tab to preview inside less. Once finished, press enter to move on to
phase 2.
     Phase 2) This is phase is entered once phase 1 is complete, or if any
arguments are passed when initially running this command. In this phase you are
prompted to enter another command, where the input from the previous phase is
available as $1. You can navigate each line of the output by using the arrow
keys. If a line is selected, that line will be available as $1.
     By default, the $1 string is not escaped. You can escape it by passing the
:escaped flag (see pipe-boy --controls for more info) or by setting the
alwaysEscapeInput config option (see pipe-boy config --help for more info). If
it is escaped, newlines will be replaced by spaces.

COLORS
     Unfortunately many commands remove colored output when it's not printed
directly to a terminal. You may have to enable colors for these commands
case-by-case. You can also setup custom functions to alias commands that force
colorized output. See below.

CUSTOM FUNCTIONS
     One drawback of this tool is that any custom aliases or functions on your
terminal are lost when executing commands. One possible solution to this is to
redefine any custom functions inside the config file
{{HOME}}/.pipe-boy/functions.sh. Every time a command is run with this tool,
these definitions will be prepended to the command string.
     Note: setting alias-es will not work, as they only take effect in
interactive shells (all commands are run inside Node's child_process, which is
not interactive).

OPTIONS
     -c, --controls   Print controls screen.
     -h, --help       Print this help screen.
     -v, --version    Print the version of this package.

```

## Controls screen
```
$ pipe-boy --controls
KEYS
     ENTER -- confirm/proceed
     TAB -- preview on-screen (if on phase 2, previews inside less)
     SHIFT+tab -- preview inside less
     ↑/↓ (up/down) -- select individual lines out of $1 *
     SHIFT+↑/↓ (up/down) -- scroll output horizontally/vertically. Hold ctrl to
scroll a half-page
     ESC cancel individual line selection *
     CTRL+r refresh/redraw
     CTRL+e erase and reset any input and output (does not change phases)

COMMANDS
     :h, :help -- print help screen
     :c, :controls -- print controls screen
     :back -- go back to phase 1 *

KEYWORDS/FLAGS
     $1 -- input from previous command or currently selected line *
     :e, :E, :escaped -- escapes input string when populating $1 *+
     :i, :I, :interactive -- inherit terminal stdio when running commands +

* -- available in phase 2
+ -- must be appended in a comment at the end of the command

```

## Config screen
```
$ pipe-boy config --help
DESCRIPTION
     Command line API to manage the configuration file(s).

USAGE
     $ pipe-boy config <command> <args> ...

EXAMPLES
     $ pipe-boy config help                  # show this help screen
     $ pipe-boy config get                   # print entire config
     $ pipe-boy config get <key> ...         # print key/value pair(s)
     $ pipe-boy config set <key> <value> ... # set key/value pair(s)
     $ pipe-boy config reset                 # reset entire config file back to
defaults
     $ pipe-boy config reset <key> ...       # reset key(s) back to defaults
     $ pipe-boy config check                 # scan config for superfluous keys
     $ pipe-boy config path                  # print path to config file

OPTIONS
     FORCE_COLOR -- sets the $FORCE_COLOR environment variable when executing
commands. Defaults to true.
     setCwdOnCd -- attempts to detect when cd is present and sets the working
directory for sub commands (used during phase 2). Defaults to true.
     alwaysEscapeInput -- escapes input string when populating $1. Defaults to
false.

```
