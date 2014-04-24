'use strict';

var mongoose = require('mongoose'),
    HueBridge = mongoose.model('HueBridge'),
    passport = require('passport');

/**
 *  Get test bridge
 */
exports.test = function (req, res, next) {
  HueBridge.findOne({name: 'test'}, function (err, bridge) {
    if (err) return next(err);
    if (!bridge)  {
      var bridge = new HueBridge();
      bridge.name = 'test';
      bridge.ipaddress = '127.0.0.1';

      bridge.save(function(err, bridge, numberAffected) {
        if (err || numberAffected <= 0) {
          return res.send(404);
        }
        res.send({ bridge: bridge });
      });
    } else {
      res.send({ bridge: bridge });
    }
  });
};

/**
 *  Get all bridges
 */
exports.bridges = function (req, res, next) {
  HueBridge.find()
      .populate('user')
      .exec(function (err, bridges) {
    if (err) return next(err);
    if (!bridges) return res.send(404);

    res.send({ bridges: bridges });
  });
};

exports.update = function (req, res, next) {
  var id = req.body.id;
  var name = String(req.body.name);

  HueBridge.findById(id, function (err, bridge) {
    bridge.name = name;
    bridge.updated = Date.now();
    bridge.save(function(err) {
      if (err) return res.send(400);

      res.send(200);
    });
  });
};
