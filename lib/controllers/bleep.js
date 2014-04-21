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
