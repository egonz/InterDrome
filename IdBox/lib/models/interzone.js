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
  angle: Number,
  pan: [],
  zoom: Number,
  default_zone: Boolean,
  bleep_zones: [{ type: Schema.Types.ObjectId, ref: 'BleepZone' }],
  created: Date,
  updated: Date
});

/**
 * Validations
 */

mongoose.model('InterZone', InterZoneSchema);
