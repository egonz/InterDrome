'use strict';

var mongoose = require('mongoose'),
    Notification = mongoose.model('Notification'),
    passport = require('passport');

/**
 *  Get all Notifications
 */
exports.all = function (req, res, next) {
  Notification.find(function (err, notifications) {
    if (err) return next(err);
    if (!notifications) return res.send(404);

    res.send({data: notifications});
  });
};

exports.show = function (req, res, next) {
  var id = req.params.id;

  Notification.findById(id, function (err, notifications) {
    if (err) return next(err);
    if (!notifications) return res.send(404);

    res.send({data:notifications});
  });
};

exports.create = function (req, res, next) {
  var newNotification = new Notification(req.body);
  newNotification.created = Date.now();

  newNotification.save(function(err) {
    if (err) return res.json(400, err);
    res.send(200);
  });
};

exports.update = function (req, res, next) {
  var id = req.params.id;

  Notification.findById(id, function (err, notification) {
    notification.name = req.body.name;
    notification.email = req.body.email;
    notification.pushover_user = req.body.pushover_user;
    notification.updated = Date.now();
    
    notification.save(function(err) {
      if (err) return res.send(400);
      res.send(200);
    });
  });
};
