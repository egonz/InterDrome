var WeMo = new require('wemo'),
	mongoose = require('mongoose'),
    WemoDevice = mongoose.model('WemoDevice');

module.exports = function(lcd, socket) {

	var ON = 1, OFF = 0;
	var _wemoClient; 
	var _firstDeviceFound = true;


	socket.addListener(function(ioclient) {
		ioclient.on('wemo', function(data) {
			console.log('Wemo Socket Action ' + data.action);

			if (data.action === 'discovery') {
				_discover();
			} else if (data.action === 'on') {
				_setBinaryState(data.wemoDevice, ON, function(err) {
					ioclient.emit('wemo-set-binary-state-result', {err: err});
				});
			} else if (data.action === 'off') {
				_setBinaryState(data.wemoDevice, OFF, function(err) {
					ioclient.emit('wemo-set-binary-state-result', {err: err});
				});
			}
		});
	});

	function _discover() {
		_wemoClient = WeMo.Search();
		_wemoClient.on('found', function(device) {
			_addWemoDevice(device);
			socket.emit('wemo-found', device);		
		});
	}

	function _saveWemoDevice(device) {
		WemoDevice.findOne({ friendlyName: device.friendlyName }, 
			function (err, wemoDevice) {
        	
        	if (err) {
            	console.log('Error finding Wemo Device using friendlyName ' + friendlyName);
            	return;
            }

            if (!wemoDevice) {
          		console.log('Saving New Wemo Device');
				wemoDevice = new WemoDevice();
				wemoDevice.friendlyName = device.friendlyName;
				wemoDevice.created = Date.now();
			} else {
				wemoDevice.updated = Date.now();
			}

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

            wemoDevice.save(function (err, wemoDevice, numberAffected) {
				if (err || numberAffected <= 0) {
					console.log("Error saving Wemo Device. " + err);
				}
			});
		});
	}

	function _addWemoDevice(device) {
		if (typeof device !== 'undefined') {
			console.log('Wemo Device Found ' + device.friendlyName);
	
			_saveWemoDevice(device);
			
			if (_firstDeviceFound) {
				_firstDeviceFound = false;
				// _flashLights(device);
			}

			lcd.print('Connected to\nWemo Device\n', lcd.colors.GREEN);
		}
	}

	function _setBinaryState(device, state, callback) {
		console.log('Setting Device %s (%s:%d) to binary state %d ', 
			device.friendlyName, device.ip, device.port, state);

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

  	_discover();

	return {
		turnOn: function(device, callback) {
			_setBinaryState(device, ON, callback);
		},

		turnOff: function(device, callback) {
			_setBinaryState(device, OFF, callback);
		}
	}
}

