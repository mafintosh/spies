var spies = require('spies');

spies(9999, function(spy) {
	spy.on('echo', function(value) {
		spy.log(value);
	});
	spy.on('load-avg', function() {
		spy.log(require('os').loadavg());
	});
});