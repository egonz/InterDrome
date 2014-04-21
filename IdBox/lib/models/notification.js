'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
    
/**
 * Bleep Schema
 */
var NotificationSchema = new Schema({
  pushover_user: String,
  created: Date,
  updated: Date
});

/**
 * Validations
 */

mongoose.model('Notification', NotificationSchema);
