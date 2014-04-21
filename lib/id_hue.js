var hue = require("node-hue-api"),
	lightState = hue.lightState,
	mongoose = require('mongoose'),
    HueBridge = mongoose.model('HueBridge'),
    HueBridgeUser = mongoose.model('HueBridgeUser'),
    HueLight = mongoose.model('HueLight');

module.exports = function(socket) {

	socket.addListener(function(ioclient) {
		ioclient.on('hue', function(data) {
			console.log('Hue Socket Action ' + JSON.stringify(data));
			
			if (data.action === 'discovery') {
				_locateBridges(function(data) {
					ioclient.emit('hue-bridges', data);
				});
			} else if (data.action === 'register') {
				_register(data.bridge, function(err, user) {
					ioclient.emit('hue-bridge-registration-complete', {err: err, user:user});
				});
			} else if (data.action === 'getLights') {
				_getLights(data.bridge, function(err, lights) {
					lights.err = err;
					ioclient.emit('hue-bridge-get-lights', lights);
				});
			} else if (data.action === 'on') {
				_on(data.bridge, data.light, function(err) {
					ioclient.emit('hue-bridge-lights', {err: err});
				});
			} else if (data.action === 'off') {
				_off(data.bridge, data.light, function(err) {
					ioclient.emit('hue-bridge-lights', {err: err});
				});
			}
		});
	});

	////////////////////////////////////////////////////////////
	// Mongodb methods
	////////////////////////////////////////////////////////////

	function _saveHueBridges(err, bridges, callback, data, index) {
		if (typeof index === 'undefined')
			index = 0;

		if (typeof data === 'undefined')
			data = { err: err, bridges: [] };

		if (err)
			callback(data);

		console.log('Discovered Bridges Length ' + bridges.length);
		console.log('Save Bridges Index ' + index);
		console.log('Data ' + JSON.stringify(data));

		if (index === bridges.length) {
			callback(data);
			return;
		}

		console.log('Looking For Hue Bridge With IP ' + bridges[index].ipaddress);

		//[{"id":"001788fffe10863d","ipaddress":"10.0.1.174"}]
		HueBridge.findOne({ ipaddress: bridges[index].ipaddress })
      		.populate('user')
      		.exec(function (err, hueBridge) {
        	
        	if (err) {
            	console.log('Error finding Hue Bridge using ipaddress ' + bridge.ipaddress);
            } else if (hueBridge) {
            	if (typeof hueBridge.user !== 'undefined' && hueBridge.user) {
            		hueBridge.registered = true;
            	} else {
            		hueBridge.registered = false;
            	}
            	console.log('Found bridge ' + hueBridge);
            	data.bridges.push(hueBridge);
            	_saveHueBridges(err, bridges, callback, data, ++index);

          	} else {
          		console.log('Saving New Hue Bridge');

				hueBridge = new HueBridge();
				hueBridge.ipaddress = bridges[index].ipaddress;
				hueBridge.created = Date.now();

	            hueBridge.save(function (err, hueBridge, numberAffected) {
					if (err || numberAffected <= 0) {
						console.log("Error saving Hue Bridge. " + err);
					}

					data.bridges.push(hueBridge);
					_saveHueBridges(err, bridges, callback, data, ++index);
				});
			}
		});
	}

	function _saveHueBridgeUser(user, bridge) {
		console.log("Created user: " + JSON.stringify(user));

		HueBridgeUser.findOne({ username: user }, function (err, hueBridgeUser) {
      		if (err) {
      			console.log('Error finding Hue Bridge User using username ' + user);
      		} else if (! hueBridgeUser ) {
      			console.log('Saving New Hue Bridge User');

				hueBridgeUser = new HueBridgeUser();
				hueBridgeUser.user_id = user;
				hueBridgeUser.bridge = bridge._id;
				hueBridgeUser.created = Date.now();

	            hueBridgeUser.save(function (err, hueBridgeUser, numberAffected) {
					if (err || numberAffected <= 0) {
						console.log("Error saving Hue Bridge User. " + err);
					} else {
						HueBridge.findOne({ ipaddress: bridge.ipaddress }, 
		      				function (err, hueBridge) {
		      				
		      				if (!err) {
		      					hueBridge.user = hueBridgeUser;
		      					hueBridge.updated = Date.now();
		      					hueBridge.save(function (err, hueBridge, numberAffected) {
		      						if (err)
		      							console.log('Error updating brige for new user.');
		      					});
		      				}
		      			});
					}
				});
      		}
      	}); 
	}

	function _saveHueLights(data, bridge, callback, index) {
		if (typeof index === 'undefined') {
			index = 0;
		} else if (index === data.lights.length) {
			callback(null, data);
			return;
		}

		HueLight.findOne({ light_id: data.lights[index].id }, function (err, hueLight) {
      		if (err) {
      			console.log('Error finding Hue Bridge User using username ' + user);
      			_saveHueLights(data, bridge, callback, ++index);
      		} else if (! hueLight ) {
      			console.log('Saving New Hue Bridge Light');

				hueLight = new HueLight();
				hueLight.light_id = data.lights[index].id;
				hueLight.name = data.lights[index].name;
				hueLight.bridge = bridge._id;
				hueLight.created = Date.now();

	            hueLight.save(function (err, hueLight, numberAffected) {
					if (err || numberAffected <= 0) {
						console.log("Error saving Hue Light. " + err);
						_saveHueLights(data, bridge, callback, ++index);
					} else {
						HueBridge.findOne({ ipaddress: bridge.ipaddress }, 
		      				function (err, hueBridge) {
		      				
		      				if (!err) {
		      					hueBridge.lights.push(hueLight);
		      					hueBridge.updated = Date.now();
		      					hueBridge.save(function (err, hueBridge, numberAffected) {
		      						if (err)
		      							console.log('Error updating brige for new user.');
		      					});
		      				}

		      				_saveHueLights(data, bridge, callback, ++index);
		      			});
					}
				});
      		} else {
      			_saveHueLights(data, bridge, callback, ++index);
      		}
      	}); 
	}



	////////////////////////////////////////////////////////////

	function _connect(bridge, onConnect) {
		HueBridge.findOne({ ipaddress: bridge.ipaddress })
      		.populate('user')
      		.exec(function (err, hueBridge) {
        	
        	if (err || !hueBridge) {
            	console.log('Error finding Hue Bridge using ipaddress ' + bridge.ipaddress);
            } else if (!hueBridge.user) {
            	console.log('Hue Bridge not registered');
            } else {
            	var _hueApi = new hue.HueApi(hueBridge.ipaddress, hueBridge.user.username);
				_hueApi.connect(function(err, config) {
					if (err) throw err;
						onConnect(err);
				});
            }
        });
	}

	function _locateBridges(onLocate) {
		hue.locateBridges(function(err, bridges) {
			console.log('locateBridges ' + JSON.stringify(bridges));
		    _saveHueBridges(err, bridges, onLocate);
		});
	}

	function _register(bridge, callback) {
		console.log('Registering User with Hue Bridge ' + bridge.ipaddress);
		var _hueApi = new hue.HueApi();
		_hueApi.createUser(bridge.ipaddress, null, null, function(err, user) {
		    if (err) {
		    	callback(err, user);
		    	return;
		    }
		    _saveHueBridgeUser(user, bridge);
		    callback(err, user);
		});
	}

	function _getLights(bridge, callback) {
		console.log('Getting Lights for Bridge using IP Address ' + bridge.ipaddress);
		console.log('And for  Bridge User ' + bridge.ipaddress);
		var hueApi = new hue.HueApi(bridge.ipaddress, bridge.user.user_id);
		hueApi.lights(function(err, lights) {
    		if (err) {
    			callback(err, lights);
    			return;
    		} else {
    			_saveHueLights(lights, bridge, callback);
    		}
		});
	}

	function _getFullState(bridge, callback) {
		var hueApi = new hue.HueApi(bridge.ipaddress, bridge.user.user_id);
		hueApi.getFullState(function(err, config) {
			if (err) throw err;
			console.log('Full State Config ' + JSON.stringify(config));
			callback(err, config);
		});
	}

	function _on(bridge, light, callback) {
		var state = lightState.create();
		var hueApi = new hue.HueApi(bridge.ipaddress, bridge.user.user_id);
		hueApi.setLightState(light.id, state.on(), function(err, result) {
			callback(err);
		});
	}

	function _off(bridge, light, callback) {
		var state = lightState.create();
		var hueApi = new hue.HueApi(bridge.ipaddress, bridge.user.user_id);
		hueApi.setLightState(light.id, state.off(), function(err, result) {
			callback(err);
		});
	}

	return {
		on: function(bridge, light, callback) {
			_on(bridge, light, callback);	
		},

		off: function(bridge, light) {
			_off(bridge, light, callback);
		}
	}

}