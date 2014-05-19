var mongoose = require('mongoose'),
	BleepAction = mongoose.model('BleepAction'),
	HueBridge = mongoose.model('HueBridge'),
	id_string = require('./id_string');

module.exports = function(pushover, wemo, hue) {

	var ENTER = "enter",
		EXIT = "exit";

	var _NOTIFICATION = "notify",
		_TURN_ON = "turn on",
		_TURN_OFF = "turn off";

	function sendEmail(bleep, email, eventType) {
		console.log("Sending " + eventType + " email to " + email);
	}

	function sendPushover(bleep, pushoverUser, eventType) {
		eventType = new String(eventType).capitalize();

		var msg = 'BLEEP ' + eventType + ': ';
			msg += bleep.name? bleep.name:bleep.address;
		var title = 'BLEEP ' + eventType;

		pushover.send(pushover.message(msg, title), pushoverUser, function(err, result) {
			if (err)
				console.log('Error sending Pushover to user ' + pushoverUser);
			else
				console.log('PUSHOVER RESULT: ' + result);
		});
	}

	function controlHueLight(light, action) {
		HueBridge.findOne({lights:light._id})
			.populate("user")
			.lean()
			.exec(function(err, hueBridge) {
				if (err) {
					console.log('Error finiding Hue Bridge for light._id ' + light._id + '; ' + err);
					return;
				}
				if (!hueBridge) {
					console.log('Hue Bridge not found for light._id ' + light._id);
					return;
				}
				
				if (action === _TURN_ON) {
					hue.turnOn(hueBridge, light.light_id, function(err, result) {
						if (err)
							console.log('Error turning ON Hue Bridge id ' + light.light_id);
						else
							console.log('Turn ON Hue Lights Result ' + result);
					});
				} else {
					hue.turnOff(hueBridge, light.light_id, function(err, result) {
						if (err)
							console.log('Error turning OFF Hue Bridge id ' + light.light_id);
						else
							console.log('Turn OFF Hue Lights Result ' + result);
					});
				}
		});
	}

	function controlWemoLight(wemoDevice, action) {
		if (action === _TURN_ON) {
			wemo.turnOn(wemoDevice, function(err) {
				if (err)
					console.log('Error turning ON Wemo device ' + wemoDevice.friendlyName);
			});
		} else {
			wemo.turnOff(wemoDevice, function(err) {
				if (err)
					console.log('Error turning OFF Wemo device ' + wemoDevice.friendlyName);
			});
		}
	}

	function handleEvent(beacon, eventType, bleep, actionTypes) {
		// Example Query:
		// db.bleepactions.find({$and: [{bleep:ObjectId("53517929b69b672802e278fd")}, 
		// {event_type:'enter'}, {$or: [{action_type:'turn on'}, {action_type:'turn off'}]}]})
		var query = {};
		query.$and = [];
		query.$and.push({bleep: bleep._id});
		query.$and.push({event_type: eventType});

		if (typeof actionTypes !== 'undefined') {
			var actionTypesQuery = [];
			for (var h=0; h<actionTypes.length; h++) {
				 actionTypesQuery.push({action_type: actionTypes[h]})
			}
			query.$and.push({$or: actionTypesQuery});
		}

		console.log('New BLEEP Action Query: ' + JSON.stringify(query));

		BleepAction.find(query)
		    .populate('hue_light wemo_device')
		    .lean()
		    .exec(function (err, bleepActions) {
		    if (err) {
		    	console.log('Error finding BleepActions for bleep ' + bleep.name + '; ' + err);
		    	return;
		    }
		    if (!bleepActions) {
		    	console.log('BleepActions not found for bleep ' + bleep.name);
		    	return;
		    }

		    for (var i=0; i<bleepActions.length; i++) {
		    	if (bleepActions[i].action_type === _NOTIFICATION) {
		    		if (typeof bleepActions[i].email !== 'undefined' && bleepActions[i].email) {
		    			sendEmail(bleep, bleepActions[i].email, eventType);
		    		} else if (typeof bleepActions[i].pushover_user !== 'undefined' && bleepActions[i].pushover_user) {
		    			sendPushover(bleep, bleepActions[i].pushover_user, eventType);
		    		}
		    	} else if (bleepActions[i].action_type === _TURN_ON || bleepActions[i].action_type === _TURN_OFF) {
		    		if (typeof bleepActions[i].hue_light !== 'undefined' && bleepActions[i].hue_light) {
		    			controlHueLight(bleepActions[i].hue_light, bleepActions[i].action_type);
		    		} else if (typeof bleepActions[i].wemo_device !== 'undefined' && bleepActions[i].wemo_device) {
		    			controlWemoLight(bleepActions[i].wemo_device, bleepActions[i].action_type);
		    		}
		    	}
		    }
		});
	}

	return {

		enter: function(beacon, bleep) {
			handleEvent(beacon, ENTER, bleep);
		},

		exit: function(beacon, bleep) {
			handleEvent(beacon, EXIT, bleep);
		},

		enterAction: function(beacon, bleep, types) {
			handleEvent(beacon, ENTER, bleep, types);
		},

		exitAction: function(beacon, bleep, types) {
			handleEvent(beacon, EXIT, bleep, types);
		},

		ACTIONS: {
			NOTIFICATION: _NOTIFICATION,
			TURN_ON: _TURN_ON,
			TURN_OFF: _TURN_OFF
		}

	};

}