var net = require('net');
var format = require('./format');
var Stream = require('stream');

var CLEAR = new Buffer('G1tIG1sySg==', 'base64');

var noop = function() {};

var Shell = function() {
	this.buffer = '';
	this.once('pipe', function(stream) {
		stream.on('error', noop); // ignore errors yo
		stream.setEncoding('utf-8');
	});

	this.readable = true;
	this.writable = true;
};

Shell.prototype.__proto__ = Stream.prototype;

Shell.prototype.write = function(data) {
	var self = this;
	var messages = (this.buffer+data).split('\n');
	this.buffer = messages.pop();
	messages.forEach(function(message) {
		if (!message.trim()) return self.emit('help');
		if (!self.readable) return;
		message = message.split(/\s+/g).map(function(item) {
			if (/^\d+$/.test(item)) return parseInt(item, 10);
			return item;
		});
		self.emit.apply(self, message);
	});
};

Shell.prototype.end = function() {
	this.finish(true);
};

Shell.prototype.destroy = function() {
	this.finish();
};

Shell.prototype.finish = function(ended) {
	if (!this.readable) return;
	this.readable = false;
	this.writable = false;
	if (ended) {
		this.emit('end');
	}
	this.emit('close');
};

Shell.prototype.log = function(value) {
	this.emit('data', format(value));
};

module.exports = function(port, onshell) {
	if (typeof port === 'function') {
		var server = module.exports(10101, port);

		server.once('error', function(err) {
			server.listen(0);
		});
		return server;
	}
	return net.createServer(function(socket) {
		var sh = new Shell();
		var cmds = [];

		socket.pipe(sh).pipe(socket);

		sh.on('newListener', function(name) {
			cmds.push(name);
		});
		sh.on('help', function() {
			sh.log(cmds);
		});
		sh.on('watch', function() {
			var args = arguments;
			var watch = setInterval(function() {
				sh.emit('data', CLEAR);
				sh.emit.apply(sh, args);
			}, 1000);

			sh.once('close', function() {
				clearInterval(watch);
			});
		});

		onshell(sh);
	}).listen(port);
};
module.exports.sh = function() {
	return new Shell();
};