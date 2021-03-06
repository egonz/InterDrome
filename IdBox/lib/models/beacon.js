'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
    
/**
 * Beacon Schema
 */
var BeaconSchema = new Schema({
  name: String,
  address: String,
  addrBuf: [Number],
  rssi: Number,
  bleepEnter: Date,
  bleep: { type: Schema.Types.ObjectId, ref: 'Bleep' },
  created: Date,
  updated: Date
});

/**
 * Validations
 */

mongoose.model('Beacon', BeaconSchema);
