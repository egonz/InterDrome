'use strict';

var mongoose = require('mongoose'),
    WemoDevice = mongoose.model('WemoDevice'),
    passport = require('passport');

/**
 *  Get all WemoDevices
 */
exports.all = function (req, res, next) {
  WemoDevice.find(function (err, wemoDevices) {
    if (err) return next(err);
    if (!wemoDevices) return res.send(404);

    res.send({ devices: wemoDevices });
  });
};
