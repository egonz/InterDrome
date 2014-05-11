'use strict';

var mongoose = require('mongoose'),
    InterZone = mongoose.model('InterZone'),
    Bleep = mongoose.model('Bleep'),
    passport = require('passport');

/**
 *  Get all BLEEPs
 */
exports.all = function (req, res, next) {
  console.log("Get All InterZones");

  InterZone.find().lean()
    .populate({path:'bleeps'})
    .exec(function (err, interZones) {

    if (err) return next(err);
    if (!interZones) return res.send(401);

    findBeacons(interZones, next, function() {
      res.send({ interZones: interZones });
    });    
  });
};

function findBeacons(interZones, next, callback, index) {
  if (typeof index === 'undefined')
    index = 0;

  if (index === interZones.length) {
    callback();
    return
  }

  Bleep.find({ interZone: interZones[index] }, { interZone: 0 })
    .populate('beacons')
    .exec(function(err, bleeps) {
    
    if (err) return next(new Error("Could not load bleeps for interZone id: " + interZones[index]));
    
    if (bleeps)
      interZones[index].bleeps = bleeps;
    
    findBeacons(interZones, next, callback, ++index);
  });
}

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
    interZone.bleeps = getBleepIds(req.body.bleeps);
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

function getBleepIds(bleeps) {
  var bleepIds = [];
  for (var i=0; i<bleeps.length; i++) {
    bleepIds.push(mongoose.Types.ObjectId(bleeps[i]._id));
  }
  return bleepIds;
}

exports.show = function (req, res, next) {
  var id = req.params.id;

  InterZone.findById(id).lean()
    .populate({path:'bleeps'})
    .exec(function (err, interZone) {

    if (err) return next(err);
    if (!interZone) return res.send(401);

    Bleep.find({ interZone: id }, { interZone: 0 })
      .populate('beacons')
      .exec(function(err, bleeps) {
        if (err) return next(new Error("Could not load bleeps for interZone id: " + interZones._id));

        interZone.bleeps = bleeps;
        res.send(interZone);
      });
  });
};
