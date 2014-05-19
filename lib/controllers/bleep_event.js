'use strict';

var mongoose = require('mongoose'),
    BleepEvent = mongoose.model('BleepEvent'),
    passport = require('passport');

/**
 *  Get all BLEEP Events
 */
exports.all = function (req, res, next) {
  BleepEvent.find()
      .populate('beacon bleep').lean()
      .exec(function (err, bleepEvents) {
    if (err) return next(err);
    if (!bleepEvents) return res.send(404);

    res.send(bleepEvents);
  });
};

exports.show = function(req, res, next) {
  var id = req.params.id;

  BleepEvent.findById(id)
      .populate('beacon bleep').lean()
      .exec(function (err, bleepEvents) {
    if (err) return next(err);
    if (!bleepEvents) return res.send(404);

    res.send(bleepEvents);
  });
};