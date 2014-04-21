var socketio = require('socket.io');

module.exports = function(server) {

	var io = socketio.listen(server);

	var _clients = [];
	var _listeners = [];

	function deleteClient(id) {
		_clients.forEach(function (element, index, array) {
    		if (element.id === id) {
    			_clients.splice(index, 1);
    			return;
    		}
		});
	}

	function _addListener(callback) {
		_listeners.push(callback);
	}

	io.sockets.on('connection', function (socket) {
		console.log('Adding Socket ' + socket.id + ' to Clients.');
		_clients.push(socket);
		
		socket.emit('connected', {});

		socket.on('disconnect', function() {
			console.log('Socket disconnect')
	    	deleteClient(socket.id);
	  	});

	  	_listeners.forEach(function (listener, index, array) {
	  		listener(socket);
		});
	});

	//TODO Add Authorization


	return {
		emit: function(event, data) {
			console.log('Socket Emit: ' + event);
			console.log('Clients Length: ' + _clients.length);
			_clients.forEach(function (element, index, array) {
    			console.log('Writing to socket');
				element.emit(event, data);
			});
		},

		addListener: function(callback) {
			_addListener(callback);
		}
	}
}