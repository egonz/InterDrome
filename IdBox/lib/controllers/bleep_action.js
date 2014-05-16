'use strict';

var mongoose = require('mongoose'),
    BleepAction = mongoose.model('BleepAction'),
    Bleep = mongoose.model('Bleep'),
    passport = require('passport');

/**
 *  Get all Notifications
 */
exports.all = function (req, res, next) {
  BleepAction.find()
    .lean()
    .populate({path:'hue_light wemo_device'})
    .exec(function (err, bleepActions) {
    
    if (err) return next(err);
    if (!bleepActions) return res.send(404);

    res.send({data: bleepActions});
  });
};

exports.show = function (req, res, next) {
  var id = req.params.id;

  BleepAction.findById(id)
    .lean()
    .populate({path:'hue_light wemo_device'})
    .exec(function (err, bleepActions) {
    if (err) return next(err);
    if (!bleepActions) return res.send(404);

    res.send({data:bleepActions});
  });
};

exports.create = function (req, res, next) {
  var newBleepAction = new BleepAction(req.body);
  newBleepAction.wemo_device = req.body.wemo_device;
  newBleepAction.hue_light = req.body.hue_light;
  
  Bleep.findById(req.body.bleep, function(err, bleep) {
    if (err) return next(err);
    if (!bleep) return res.send(404);

    newBleepAction.bleep = bleep._id;
    newBleepAction.created = Date.now();

    newBleepAction.save(function(err, bleepAction) {
      if (err) return res.json(400, err);
      if (!bleepAction) return res.send(404);
      
      if (typeof bleep.actions === 'undefined') {
        bleep.actions = [];
      }

      bleep.actions.push(bleepAction._id);
      bleep.updated = Date.now();

      bleep.save(function(err) {
        if (err) return res.json(400, err);
        res.send(200);
      });
    });
  });
};

exports.update = function (req, res, next) {
  var id = req.params.id;

  BleepAction.findById(id, function (err, bleepAction) {
    bleepAction.wemo_device = req.body.wemo_device;
    bleepAction.hue_light = req.body.hue_light;
    bleepAction.email = req.body.email;
    bleepAction.pushover_user = req.body.pushover_user;
    bleepAction.event_type = req.body.event_type;
    bleepAction.action_type = req.body.action_type;
    bleepAction.control_type = req.body.control_type;
    bleepAction.updated = Date.now();

    bleepAction.save(function(err) {
      if (err) return res.send(400);
      res.send(200);
    });
  });
};
