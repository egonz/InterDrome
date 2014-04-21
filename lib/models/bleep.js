'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
    
/**
 * Bleep Schema
 */
var BleepSchema = new Schema({
  name: String,
  address: String,
  beacons: [{ type: Schema.Types.ObjectId, ref: 'Beacon' }],
  created: Date,
  updated: Date
});

/**
 * Validations
 */

mongoose.model('Bleep', BleepSchema);
