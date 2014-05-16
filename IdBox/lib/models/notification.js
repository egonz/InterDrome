'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
    
/**
 * Notification Schema
 */
 // TODO Consider seperating email and pushover into seperate schemas 
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
