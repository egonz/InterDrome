'use strict';

var api = require('./controllers/api'),
    index = require('./controllers'),
    users = require('./controllers/users'),
    session = require('./controllers/session'),
    hue = require('./controllers/hue'),
    bleep = require('./controllers/bleep'),
    beacon = require('./controllers/beacon'),
    wemo = require('./controllers/wemo');

var middleware = require('./middleware');

/**
 * Application routes
 */
module.exports = function(app) {

  // Server API Routes
  // app.get('/api/awesomeThings', api.awesomeThings);
  
  app.post('/api/users', users.create);
  app.put('/api/users', users.changePassword);
  app.get('/api/users/me', users.me);
  app.get('/api/users/:id', users.show);

  app.post('/api/session', session.login);
  app.del('/api/session', session.logout);

  app.get('/api/hue/bridges/test', hue.test);
  app.get('/api/hue/bridges', hue.bridges);
  app.put('/api/hue/bridges', hue.update);

  app.get('/api/wemos', wemo.all);

  app.get('/api/bleeps', bleep.all);
  app.put('/api/bleeps', bleep.update);

  app.get('/api/beacons', beacon.all);
  app.put('/api/beacons', beacon.update);

  // All undefined api routes should return a 404
  app.get('/api/*', function(req, res) {
    res.send(404);
  });
  
  // All other routes to use Angular routing in app/scripts/app.js
  app.get('/partials/*', index.partials);
  app.get('/*', middleware.setUserCookie, index.index);
};