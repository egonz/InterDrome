'use strict';

var express = require('express'),
    path = require('path'),
    fs = require('fs'),
    mongoose = require('mongoose');

var lcd,
    pushover,
    xbee;

/**
 * Main application file
 */

 process.on('SIGINT', function() {
	console.log("\nGracefully shutting down from SIGINT (Ctrl-C)");
	
	if (typeof lcd !== 'undefined')
		lcd.turn_off();
	// some other closing procedures go here
	process.exit();
});

// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Application Config
var config = require('./lib/config/config');

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

var id_network_ip = require('./lib/id_network_ip.js');

id_network_ip.getNetworkIPs(function (error, ip) {
	if (error) {
		console.log('error:', error);
	}

	lcd = require('./lib/id_lcd.js')(ip, config.port);
	pushover = require('./lib/id_pushover.js')(config);
	xbee = require('./lib/id_xbee')(lcd, pushover);

	pushover.send(pushover.message("Inter.'.Drome Startup", 
	    "Inter.'.Drome"), function(err, result) {
		if (err) {
			console.log( 'Error sending Pushover Notification.' );
		} else {
			console.log( 'Pushover Notification sent. Result: ' + result );
		}
	});

	lcd.turn_off();
}, false);


// Passport Configuration
var passport = require('./lib/config/passport');

var app = express();

// Express settings
require('./lib/config/express')(app);

// Routing
require('./lib/routes')(app);

// Start server
app.listen(config.port, function () {
  console.log('Express server listening on port %d in %s mode', config.port, app.get('env'));
});

// Expose app
exports = module.exports = app;