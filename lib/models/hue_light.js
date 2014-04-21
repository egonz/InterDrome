'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
    
/**
 * Bleep Schema
 */
var HueLightSchema = new Schema({
  light_id: Number,
  name: String,
  bridge: { type: Schema.Types.ObjectId, ref: 'HueBridge' },
  created: Date,
  updated: Date
});

/**
 * Validations
 */

mongoose.model('HueLight', HueLightSchema);
