'use strict';

var express = require('express'),
    path = require('path'),
    fs = require('fs'),
    mongoose = require('mongoose');

var lcd,
    pushover,
    xbee,
    hue,
    wemo,
    bleepActions;

/**
 * Main application file
 */

// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Application Config
var config = require('./lib/config/config');

process.on('SIGINT', function() {
	console.log("\nGracefully shutting down from SIGINT (Ctrl-C)");
	
	if (typeof lcd !== 'undefined')
		lcd.turn_off();

	if (typeof pushover !== 'undefined') {
		//TODO Send to admin pushover_user
		pushover.send(pushover.message('Shutting Down.', 
			'Shutting Down'), config.pushover.user, function(err, result) {
			if (err) {
            	console.log( 'Error sending Pushover Notification.' );
          	} else {
            	console.log( 'Pushover Notification sent. Result: ' + result );
          	}
      	});
	}

	// some other closing procedures go here
	process.exit();
});

// Connect to database
var db = mongoose.connect(config.mongo.uri, config.mongo.options);

// Bootstrap models
var modelsPath = path.join(__dirname, 'lib/models');
fs.readdirSync(modelsPath).forEach(function (file) {
  if (/(.*)\.(js$|coffee$)/.test(file)) {
    require(modelsPath + '/' + file);
  }
});

// Populate empty DB with sample data
require('./lib/config/dummydata');


// Passport Configuration
var passport = require('./lib/config/passport');

var app = express(),
	server = require('http').createServer(app),
	id_network_ip = require('./lib/id_network_ip.js'),
	socket = require('./lib/id_socket')(server);

id_network_ip.getNetworkIPs(function (error, ip) {
	if (error) {
		console.log('error:', error);
	}

	lcd = require('./lib/id_lcd')(ip, config.port);
	hue = require('./lib/id_hue')(socket);
	wemo = require('./lib/id_wemo')(lcd, socket);
	pushover = require('./lib/id_pushover')(config);
	bleepActions = require('./lib/id_bleep_actions')(pushover, wemo, hue);
	xbee = require('./lib/id_xbee')(lcd, socket, bleepActions);

	//TODO Send to admin pushover_user 
	pushover.send(pushover.message("Inter.'.Drome Startup", 
	    "Inter.'.Drome"), config.pushover.user, function(err, result) {
		if (err) {
			console.log( 'Error sending Pushover Notification.' );
		} else {
			console.log( 'Pushover Notification sent. Result: ' + result );
		}
	});

	lcd.turn_off();
}, false);

// Express settings
require('./lib/config/express')(app);

// Routing
require('./lib/routes')(app);

// Start server
server.listen(config.port, function(){
    console.log("Express server listening on port %d in %s mode", config.port, app.get('env'));
});

// Expose app
exports = module.exports = app;