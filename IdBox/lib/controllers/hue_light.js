'use strict';

var mongoose = require('mongoose'),
    HueLight = mongoose.model('HueLight'),
    HueBridge = mongoose.model('HueBridge'),
    passport = require('passport');

/**
 *  Get all Notifications
 */
exports.all = function (req, res, next) {
  HueLight.find(function (err, hueLights) {
    if (err) return next(err);
    if (!hueLights) return res.send(404);

    res.send({data: hueLights});
  });
};

exports.show = function (req, res, next) {
  var id = req.params.id;

  HueLight.findById(id, function (err, hueLights) {
    if (err) return next(err);
    if (!hueLights) return res.send(404);

    res.send({data:hueLights});
  });
};

exports.create = function (req, res, next) {
  var newHueLight = new HueLight(req.body);
  newHueLight.created = Date.now();

  newHueLight.save(function(err) {
    if (err) return res.json(400, err);
    res.send(200);
  });
};

exports.update = function (req, res, next) {
  var id = req.params.id;

  HueLight.findById(id, function (err, hueLight) {
    if (typeof req.body.interZone !== 'undefined') {
      HueBridge.findById(req.body.bridge, function (err, hueBridge) {
        if (err) return next(err);
        if (!hueBridge)  return res.send(404);
        hueLight.bridge = hueBridge._id;
        saveHueLight(hueLight, req, res, next);
      });
    } else {
      saveHueLight(hueLight, req, res, next);
    }
  });
};

function saveHueLight(hueLight, req, res, next) {
  hueLight.light_id = req.body.light_id;
  hueLight.name = req.body.name;
  hueLight.bridge = req.body.bridge;
  hueLight.updated = Date.now();
  
  hueLight.save(function(err) {
    if (err) return res.send(400);
    res.send(200);
  });
}
