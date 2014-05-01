'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
    
/**
 * Bleep Schema
 */
var BleepZoneSchema = new Schema({
  bleep: [{ type: Schema.Types.ObjectId, ref: 'Bleep' }],
  location: {x: Number, y: Number},
  created: Date,
  updated: Date
});

/**
 * Validations
 */

mongoose.model('BleepZone', BleepZoneSchema);
