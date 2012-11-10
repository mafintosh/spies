var Stream = require('stream');
var format = require('./format');

var CLEAR = '\u001b[H\u001b[2J';

var noop = function() {};

var Spy = function() {
	this.buffer = '';
	this.once('pipe', function(stream) {
		stream.on('error', noop); // ignore errors yo
		if (!stream.setEncoding) return;
		stream.setEncoding('utf-8');
	});

	this.readable = true;
	this.writable = true;
};

Spy.prototype.__proto__ = Stream.prototype;

Spy.prototype.write = function(data) {
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

Spy.prototype.end = function() {
	this.finish(true);
};

Spy.prototype.destroy = function() {
	this.finish();
};

Spy.prototype.finish = function(ended) {
	if (!this.readable) return;
	this.readable = false;
	this.writable = false;
	if (ended) {
		this.emit('end');
	}
	this.emit('close');
};

Spy.prototype.log = function(value) {
	this.emit('data', format(value));
};

var spies = function() {
	var sh = new Spy();
	var cmds = [];

	sh.on('newListener', function(name) {
		if (name in {data:1,close:1,end:1,drain:1,error:1}) return;
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

	return sh;
};

spies.listen = function(port, onSpy) {
	if (typeof port === 'function') {
		var server = spies.listen(10101, port);
		server.once('error', function(err) {
			server.listen(0);
		});
		return server;
	}
	return require('net').createServer(function(socket) {
		var spy = spies();
		socket.pipe(spy).pipe(spies);
		onSpy(spy);
	});
};

module.exports = spies;