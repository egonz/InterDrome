'use strict';

var path = require('path');

var rootPath = path.normalize(__dirname + '/../../..');

module.exports = {
  root: rootPath,
  port: process.env.PORT || 3000,
  mongo: {
    options: {
      db: {
        safe: true
      }
    }
  },
  pushover: {
    user: 'uHMCRTRpjfQNDkf3qdtrJ4Q373Rg5R',
    token: 'apr7qqQXuCTeb4pTLZzWF1YQ2G1K8J'
  }
};