var push = require( 'pushover-notifications' );

module.exports = function(config) {
	console.log('User:' + config.pushover.user);
	console.log('Token:' + config.pushover.token);
	var p = new push( {
	    user: config.pushover.user,
	    token: config.pushover.token,
	    // onerror: function(error) {},
	    // update_sounds: true // update the list of sounds every day - will
	    // prevent app from exiting.
	});

	return {
		message: function(message, title, sound, device, priority) {
			var _msg = {
			    message: message,
			    title: title,
			    sound: sound, // optional
			    device: device, // optional
			    priority: priority // optional
			};

			return _msg;
		},

		send: function(msg, callback) {
			p.send( msg, function( err, result ) {
			    if (typeof callback !== 'undefined') {
			    	callback(err, result);
			    }
			});
		}
	}
}




