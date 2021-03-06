'use strict';

var api = require('./controllers/api'),
    index = require('./controllers'),
    users = require('./controllers/users'),
    session = require('./controllers/session'),
    hue = require('./controllers/hue'),
    bleep = require('./controllers/bleep'),
    beacon = require('./controllers/beacon'),
    wemo = require('./controllers/wemo'),
    notification = require('./controllers/notification'),
    interzone = require('./controllers/interzone'),
    bleepEvents = require('./controllers/bleep_event'),
    hueLight = require('./controllers/hue_light'),
    bleepActions = require('./controllers/bleep_action');

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
  app.get('/api/bleeps/:id', bleep.show);
  app.put('/api/bleeps/:id', bleep.update);

  app.get('/api/beacons', beacon.all);
  app.put('/api/beacons', beacon.update);

  app.get('/api/notifications', notification.all);
  app.post('/api/notifications', notification.create);
  app.put('/api/notifications/:id', notification.update);
  app.get('/api/notifications/:id', notification.show);
  
  app.get('/api/interzones', interzone.all);
  app.post('/api/interzones', interzone.create);
  app.put('/api/interzones/:id', interzone.update);
  app.get('/api/interzones/:id', interzone.show);

  app.get('/api/hue/lights', hueLight.all);
  app.post('/api/hue/lights', hueLight.create);
  app.put('/api/hue/lights/:id', hueLight.update);
  app.get('/api/hue/lights/:id', hueLight.show);

  app.get('/api/bleep/actions', bleepActions.all);
  app.post('/api/bleep/actions', bleepActions.create);
  app.put('/api/bleep/actions/:id', bleepActions.update);
  app.get('/api/bleep/actions/:id', bleepActions.show);

  app.get('/api/bleep/events', bleepEvents.all);
  app.get('/api/bleep/events/:id', bleepEvents.show);

  // All undefined api routes should return a 404
  app.get('/api/*', function(req, res) {
    res.send(404);
  });
  
  // All other routes to use Angular routing in app/scripts/app.js
  app.get('/partials/*', index.partials);
  app.get('/*', middleware.setUserCookie, index.index);
};