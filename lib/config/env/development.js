'use strict';

module.exports = {
  env: 'development',
  mongo: {
    uri: 'mongodb://localhost/InterDrome-dev'
  },
  xbee: {
  	serial: {
  		port: "/dev/tty.usbserial-A702NV1E",
  		baud: 9600
  	}
  }
};