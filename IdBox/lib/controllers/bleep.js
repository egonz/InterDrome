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
      .populate('beacons')
      .exec(function (err, bleep) {
    if (err) return next(err);
    if (!bleep) return res.send(404);

    bleep.actions = [];

    BleepAction.find({ bleep: id }, { interZone: 0 })
      .populate('hue_light wemo_device')
      .exec(function(err, bleepActions) {
        if (err) return next(new Error("Could not load bleep actions for bleep id: " + id));
        bleep.actions.push(bleepActions);
        res.send({ bleep: bleep });
      });
  });
};

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
