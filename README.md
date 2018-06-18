# `pipe-boy`
> Interactive CLI to pass output from one command as input to another

Node 7+ required!

```sh
$ npm install --global pipe-boy
```

## Usage
```
pipe-boy

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

COLORS
     Unfortunately many commands remove colored output when it's not printed
directly to a terminal. You may have to enable colors for these command
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
```

## Config
```
$ pipe-boy config help
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

CONFIG KEYS
     FORCE_COLOR -- sets the $FORCE_COLOR environment variable when executing
commands
```
