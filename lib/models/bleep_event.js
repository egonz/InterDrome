'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    BleepSchema = require('./bleep'),
    BeaconSchema = require('./beacon');
    
/**
 * BleepEvent Schema
 */
var BleepEventSchema = new Schema({
  event: String,
  bleep: [BleepSchema],
  beacon: [BeaconSchema],
  created: { type: Date, default: Date.now }
});

/**
 * Validations
 */

mongoose.model('BleepEvent', BleepEventSchema);
