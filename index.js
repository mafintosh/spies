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
	this.finish('end');
};

Shell.prototype.destroy = function() {
	this.finish('close');
};

Shell.prototype.finish = function(name) {
	if (!this.readable) return;
	this.readable = false;
	this.writable = false;
	this.emit(name);
};

Shell.prototype.log = function(value) {
	this.emit('data', format(value));
};

module.exports = function(port, onshell) {
	net.createServer(function(socket) {
		var sh = new Shell();

		socket.pipe(sh).pipe(socket);

		var cmds = [];

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