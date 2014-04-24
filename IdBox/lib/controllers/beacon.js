'use strict';

var mongoose = require('mongoose'),
    Beacon = mongoose.model('Beacon'),
    passport = require('passport');

/**
 *  Get all Beacon
 */
exports.all = function (req, res, next) {
  Beacon.find()
      .populate('bleep')
      .exec(function (err, beacons) {
    if (err) return next(err);
    if (!beacons) return res.send(404);

    res.send({ beacons: beacons });
  });
};


/**
 *  Update Beacon
 */
exports.update = function (req, res, next) {
  var beaconId = req.body.id;
  var name = String(req.body.name);

  Beacon.findById(beaconId, function (err, beacon) {
    beacon.name = name;
    beacon.updated = Date.now();
    beacon.save(function(err) {
      if (err) return res.send(400);

      res.send(200);
    });
  });
};
