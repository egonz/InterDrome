'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
    
/**
 * Bleep Schema
 */
var BleepActionSchema = new Schema({
  bleep: { type: Schema.Types.ObjectId, ref: 'Bleep' },
  hue_lights: [ { type: Schema.Types.ObjectId, ref: 'HueLight' } ],
  wemo_devices: [ { type: Schema.Types.ObjectId, ref: 'WemoDevice' } ],
  notifications: [ { type: Schema.Types.ObjectId, ref: 'Notification' } ],
  created: Date,
  updated: Date
});

/**
 * Validations
 */

mongoose.model('BleepAction', BleepActionSchema);
