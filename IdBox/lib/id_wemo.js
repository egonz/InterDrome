var WeMo = new require('wemo'),
	mongoose = require('mongoose'),
    WemoDevice = mongoose.model('WemoDevice');

module.exports = function(lcd) {

	var ON = 1, OFF = 0;
	var _wemoClient; 
	var _wemoDevices = {};
	var _firstDeviceFound = true;

	_wemoClient = WeMo.Search();
	_wemoClient.on('found', function(device) {
		_addWemoDevice(device);				
	});

	function _saveWemoDevice(device) {
		WemoDevice.findOne({ friendlyName: device.friendlyName }, 
			function (err, wemoDevice) {
        	
        	if (err) {
            	console.log('Error finding Wemo Device using friendlyName ' + friendlyName);
            }

            if (!wemoDevice) {
          		console.log('Saving New Wemo Device');

				wemoDevice = new WemoDevice();
				wemoDevice.friendlyName = device.friendlyName;
				wemoDevice.ip = device.ip;
				wemoDevice.port = device.port;
				wemoDevice.deviceType = device.deviceType;	
				wemoDevice.manufacturer = device.manufacturer;
				wemoDevice.manufacturerURL = device.manufacturerURL;
				wemoDevice.wemoModelDescription = device.modelDescription;
				wemoDevice.wemoModelName = device.modelName;
				wemoDevice.wemoModelNumber = device.modelNumber;
				wemoDevice.wemoModelURL = device.modelURL;
				wemoDevice.serialNumber = device.serialNumber;
				wemoDevice.UDN = device.UDN;
				wemoDevice.UPC = device.UPC;
				wemoDevice.macAddress = device.macAddress;
				wemoDevice.firmwareVersion = device.firmwareVersion;
				wemoDevice.iconVersion = device.iconVersion;
				wemoDevice.binaryState = device.binaryState;
  				wemoDevice.presentationURL = device.presentationURL;
				wemoDevice.created = Date.now();

	            wemoDevice.save(function (err, wemoDevice, numberAffected) {
					if (err || numberAffected <= 0) {
						console.log("Error saving Wemo Device. " + err);
					}
				});
			}
		});
	}

	function _addWemoDevice(device) {
		console.log('Wemo Device Found');
		console.log(device);

		console.log('Looking for Device ' + device.friendlyName);

		if (!(device.friendlyName in _wemoDevices)) {
			console.log('Adding New Wemo Device');
			_wemoDevices[device.friendlyName] = device;
			_saveWemoDevice(device);
		} else {
			console.log('Existing Wemo Device Discovered');
		}

		if (_firstDeviceFound) {
			_firstDeviceFound = false;
			_flashLights(device);
		}

		lcd.print('Connected to\nWemo Device\n', lcd.colors.GREEN);
	}

	function _setBinaryState(device, state, callback) {
		console.log('Setting Device %s to binary state %d ', device.friendlyName, state);

    	var wemoDevice = new WeMo(device.ip, device.port);
      	wemoDevice.setBinaryState(state, function(err, result) {
        	if (err) {
          		console.error('Error sending ' + (state===ON?'ON':'OFF') + 
            		' signal to Wemo Switch. ' + err);
        	}
        	if (typeof callback !== 'undefined')
          		callback(err);
      });
  	}

  	function _flashLights(device) {
    	_setBinaryState(device, OFF, function() {
      		setTimeout(function() {
        		_setBinaryState(device, ON, function() {
	          		setTimeout(function() {
	            		_setBinaryState(device, OFF);
	          		}, 2000);
        		});
      		}, 2000);
    	});
  	}

	return {
		getDevices: function() {
			return _wemoDevices;
		},

		turnOn: function(device, callback) {
			_setBinaryState(device, ON, callback);
		},

		turnOff: function(device, callback) {
			_setBinaryState(device, OFF, callback);
		}
	}
}

