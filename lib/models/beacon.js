'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
    
/**
 * Beacon Schema
 */
var BeaconSchema = new Schema({
  address: String,
  addrBuf: [Number],
  rssi: Number,
  bleep: { type: Schema.Types.ObjectId, ref: 'Bleep' },
  created: Date,
  updated: Date
});

/**
 * Validations
 */

mongoose.model('Beacon', BeaconSchema);
