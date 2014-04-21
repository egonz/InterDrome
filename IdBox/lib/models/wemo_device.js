'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
    
/**
 * Wemo Switch Schema
 */
var WemoDeviceSchema = new Schema({
	friendlyName: String,
	ip: String,
	port: Number,
	deviceType: String,	
	manufacturer: String,
	manufacturerURL: String,
	wemoModelDescription: String,
	wemoModelName: String,
	wemoModelNumber: String,
	modelURL: String,
	serialNumber: String,
	UDN: String,
	UPC: String,
	macAddress: String,
	firmwareVersion: String,
	iconVersion: String,
	binaryState: Number,
	iconList: String,
	serviceList: String,
  	presentationURL: String,
  	created: Date,
  	updated: Date
});

/**
 * Validations
 */

mongoose.model('WemoDevice', WemoDeviceSchema);
