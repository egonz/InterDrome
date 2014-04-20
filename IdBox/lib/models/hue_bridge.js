'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
    
/**
 * Bleep Schema
 */
var HueBridgeSchema = new Schema({
  name: String,
  ipaddress: String,
  user: { type: Schema.Types.ObjectId, ref: 'HueBridgeUser' },
  lights: [{ type: Schema.Types.ObjectId, ref: 'HueLight' }],
  created: Date,
  updated: Date
});

/**
 * Validations
 */

mongoose.model('HueBridge', HueBridgeSchema);
