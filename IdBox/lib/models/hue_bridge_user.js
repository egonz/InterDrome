'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
    
/**
 * Bleep Schema
 */
var HueBridgeUserSchema = new Schema({
  user_id: String,
  bridge: { type: Schema.Types.ObjectId, ref: 'HueBridge' },
  created: Date,
  updated: Date
});

/**
 * Validations
 */

mongoose.model('HueBridgeUser', HueBridgeUserSchema);
