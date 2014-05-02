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
  console.log('Updating InterZone ');

  var id = req.params.id;
  
  console.log('Updating ID ' + id);
  
  InterZone.findById(id, function (err, interZone) {
    if (err) res.send(404);
    if (!interZone) {
      console.log('InterZone not found for id %d', id);
      return res.send(404);
    }

    interZone.name = req.body.name;
    interZone.loc = req.body.loc;
    interZone.points = req.body.points;
    interZone.angle = Number(req.body.angle);
    interZone.pan = req.body.pan;
    interZone.zoom = Number(req.body.zoom);
    interZone.default_zone = Boolean(req.body.default_zone);

    // if (typeof req.body.bleep_zones !== 'undefined' && req.body.bleep_zones)
      
    interZone.updated = Date.now();
    
    interZone.save(function(err) {
      if (err) {
        console.log(JSON.stringify(err));
        return res.send(400);
      }
      res.send(200);
    });
  });
};

exports.show = function (req, res, next) {
  var id = req.params.id;

  InterZone.findById(id, function (err, interZone) {
    if (err) res.send(404);
    if (!interZone) {
      console.log('InterZone not found for id %d', id);
      return res.send(404);
    }

    console.log('returning ' + JSON.stringify(interZone));

    res.send(interZone);
  });
};
