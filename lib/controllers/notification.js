'use strict';

var mongoose = require('mongoose'),
    Notification = mongoose.model('Notification'),
    passport = require('passport');

/**
 *  Get all BLEEPs
 */
exports.all = function (req, res, next) {
  Notification.find(function (err, notifications) {
    if (err) return next(err);
    if (!notifications) return res.send(404);

    res.send({ notifications: notifications });
  });
};

exports.create = function (req, res, next) {
  var newNotification = new Notification(req.body);
  newNotification.save(function(err) {
    if (err) return res.json(400, err);
  });
};

exports.update = function (req, res, next) {
  var id = req.body.id;
  var name = String(req.body.name);
  var email = String(req.body.email);
  var pushover_user = String(req.body.pushover_user);

  Notification.findById(id, function (err, notification) {
    notification.name = name;
    notification.email = email;
    notification.pushover_user = pushover_user;
    notification.updated = Date.now();
    
    notification.save(function(err) {
      if (err) return res.send(400);

      res.send(200);
    });
  });
};
