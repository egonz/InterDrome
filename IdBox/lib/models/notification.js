'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
    
/**
 * Bleep Schema
 */
var NotificationSchema = new Schema({
  name: String,
  pushover_user: String,
  email: String,
  created: Date,
  updated: Date
});

/**
 * Validations
 */

mongoose.model('Notification', NotificationSchema);
