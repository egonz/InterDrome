'use strict';

var mongoose = require('mongoose'),
    Bleep = mongoose.model('Bleep'),
    BleepAction = mongoose.model('BleepAction'),
    InterZone = mongoose.model('InterZone'),
    passport = require('passport');

/**
 *  Get all BLEEPs
 */
exports.all = function (req, res, next) {
  Bleep.find()
      .lean()
      .populate('beacons')
      .exec(function (err, bleeps) {
    if (err) return next(err);
    if (!bleeps) return res.send(404);

    res.send({ bleeps: bleeps });
  });
};

exports.show = function(req, res, next) {
  var id = req.params.id;

  Bleep.findById(id)
      .lean()
      .populate('beacons actions')
      .exec(function (err, bleep) {
    if (err) return next(err);
    if (!bleep) return res.send(404);

    loadBleepActions(bleep, res, function() {
      res.send({ bleep: bleep });
    });
  });
};

function loadBleepActions(bleep, res, callback, index) {
  if (typeof index === 'undefined')
    index = 0;

  if (typeof bleep.actions === 'undefined' || index === bleep.actions.length) {
    callback();
    return;
  }

  BleepAction.findById(bleep.actions[index]._id)
    .lean()
    .populate('hue_light wemo_device')
    .exec(function(err, bleepAction) {
      if (err) return next(new Error("Could not load bleep actions for bleep id: " + id));
      if (bleepAction)
        bleep.actions[index] = bleepAction;
      
      loadBleepActions(bleep, res, callback, ++index);
  });
}

/**
 *  Update BLEEP
 */
exports.update = function (req, res, next) {
  var id = req.params.id;
  
  Bleep.findById(id, function (err, bleep) {
    if (typeof req.body.interZone !== 'undefined') {
      InterZone.findById(req.body.interZone, function (err, interZone) {
        if (err) return next(err);
        if (!interZone)  return res.send(404);
        bleep.interZone = interZone._id;
        saveBleep(bleep, req, res, next);
      });
    } else {
      saveBleep(bleep, req, res, next);
    }
  });
};

function saveBleep(bleep, req, res, next) {
  bleep.name = req.body.name;
  bleep.location = req.body.location;
  bleep.updated = Date.now();
  bleep.save(function(err) {
    if (err) return res.send(400);
    res.send(200);
  });
}
