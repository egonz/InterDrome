'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
    
/**
 * Bleep Schema
 */
var BleepActionSchema = new Schema({
  bleep: { type: Schema.Types.ObjectId, ref: 'Bleep' },
  event_type: String,
  action_type: String,
  control_type: String,
  hue_light: { type: Schema.Types.ObjectId, ref: 'HueLight' },
  wemo_device: { type: Schema.Types.ObjectId, ref: 'WemoDevice' },
  pushover_user: String,
  email: String,
  created: Date,
  updated: Date
});

/**
 * Validations
 */

mongoose.model('BleepAction', BleepActionSchema);
