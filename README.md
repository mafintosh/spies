# spies

Spy on a running node program by having a man on the inside

	npm install spies

The first thing you need is to setup a spy inside your program

``` js
var spies = require('spies');

spies(9999, function(spy) {
	spy.on('echo', function(value) {
		spy.log(value);
	});
	spy.on('load-avg', function() {
		spy.log(require('os').loadavg());
	});
});
```

Afterwards you can use `netcat` to contact and debrief your spy

	nc localhost 9999

This starts a `repl` where you can type in commands

	help
	$ : help
	  : watch
	  : echo
	  : load-avg

`help` and `watch` are build in commands than print the help and runs the same command every 1 second.
You invoke a command simply typing it and pressing `enter` and the result will be pretty printed below.

	load-avg
	$ : 0.30126953125
	  : 0.3203125
	  : 0.33642578125

To pass arguments to the commands simply seperate them them by a `space`

	echo hello
	$ : hello