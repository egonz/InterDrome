'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
    
/**
 * Bleep Schema
 */
var InterZoneSchema = new Schema({
  name: String,
  loc: {latitude: Number, longitude: Number}, 
  points: [],
  bleep_zones: [{ type: Schema.Types.ObjectId, ref: 'BleepZone' }],
  created: Date,
  updated: Date
});

/**
 * Validations
 */

mongoose.model('InterZone', InterZoneSchema);
