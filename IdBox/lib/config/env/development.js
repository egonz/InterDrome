'use strict';

module.exports = {
  env: 'development',
  mongo: {
    uri: 'mongodb://localhost/fullstack-dev'
  },
  xbee: {
  	serial: {
  		port: "/dev/tty.usbserial-A702NUVT",
  		baud: 9600
  	}
  }
};