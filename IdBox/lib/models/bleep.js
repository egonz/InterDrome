'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
    
/**
 * Bleep Schema
 */
var BleepSchema = new Schema({
  name: String,
  address: String,
  location: {x: Number, y: Number},
  beacons: [{ type: Schema.Types.ObjectId, ref: 'Beacon' }],
  interZone: { type: Schema.Types.ObjectId, ref: 'InterZone' },
  actions: [{ type: Schema.Types.ObjectId, ref: 'BleepAction' }],
  created: Date,
  updated: Date
});

/**
 * Validations
 */

mongoose.model('Bleep', BleepSchema);
