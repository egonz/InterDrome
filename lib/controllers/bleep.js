'use strict';

var mongoose = require('mongoose'),
    Bleep = mongoose.model('Bleep'),
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


/**
 *  Update BLEEP
 */
exports.update = function (req, res, next) {
  var bleepId = req.body.id;
  var name = String(req.body.name);
  console.log('BLEEP ID ' + bleepId);
  console.log('NEW BLEEP NAME ' + name);

  Bleep.findById(bleepId, function (err, bleep) {
    bleep.name = name;
    bleep.updated = Date.now();
    bleep.save(function(err) {
      if (err) return res.send(400);

      res.send(200);
    });
  });
};
