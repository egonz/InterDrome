'use strict';

module.exports = {
  env: 'test',
  mongo: {
    uri: 'mongodb://localhost/InterDrome-test'
  },
  xbee: {
  	serial: {
  		port: "/dev/tty.usbserial-A702NUVT",
  		baud: 9600
  	}
  }
};