'use strict';

var mongoose = require('mongoose'),
    InterZone = mongoose.model('InterZone'),
    passport = require('passport');

/**
 *  Get all BLEEPs
 */
exports.all = function (req, res, next) {
  InterZone.find(function (err, interZones) {
    if (err) return next(err);
    if (!interZones) return res.send(404);

    res.send({ interZones: interZones });
  });
};

exports.create = function (req, res, next) {
  var newInterZone = new InterZone(req.body);
  newInterZone.save(function(err) {
    if (err) return res.json(400, err);
    res.send(200);
  });
};

exports.update = function (req, res, next) {
  var id = req.params.id;
  var name = String(req.body.name);
  var loc = String(req.body.loc);
  var points = String(req.body.points);
  var bleep_zones = String(req.body.bleep_zones);

  console.log('Updating ID ' + id);

  InterZone.findById(id, function (err, interZone) {
    interZone.name = name;
    interZone.loc = loc;
    interZone.points = points;
    interZone.bleep_zones = bleep_zones;
    interZone.updated = Date.now();
    
    interZone.save(function(err) {
      if (err) return res.send(400);

      res.send(200);
    });
  });
};

exports.show = function (req, res, next) {
  var id = req.params.id;

  //{loc: {latitude:parseFloat(latitude),longitude:parseFloat(longitude)}}

  InterZone.findById(id, function (err, interZone) {
    if (err) res.send(404);
    if (!interZone) {
      console.log('InterZone not found for lat %d and lon %d', latitude, longitude);
      return res.send(404);
    }

    console.log('returning ' + JSON.stringify(interZone));

    res.send(interZone);
  });
};
