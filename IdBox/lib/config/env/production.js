'use strict';

module.exports = {
  env: 'production',
  mongo: {
    uri: process.env.MONGOLAB_URI ||
         process.env.MONGOHQ_URL ||
         'mongodb://localhost/InterDrome'
  },
  xbee: {
  	serial: {
  		port: "/dev/ttyUSB0",
  		baud: 9600
  	}
  }
};