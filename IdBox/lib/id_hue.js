var hue = require("node-hue-api");

module.export = function() {

	var _hueApi;
	var _bridge; //[{"id":"001788fffe10863d","ipaddress":"10.0.1.174"}]
	var _bridgeUser;
	var _connected;
	var _registered;

	var USER_DESCRIPTION = "Inter.'.Drome";


	////////////////////////////////////////////////////////////
	// Mongodb methods
	////////////////////////////////////////////////////////////

	function _loadHueBridge(onConnect) {
		//TODO load bridge from Mongo
		if (_bridge) {
			_connect(onConnect)
		}
	}

	function _loadHueBrigeUser() {

	}

	function _saveHueBridge() {

	}

	function _saveHueBridgeUser(user) {
		console.log("Created user: " + JSON.stringify(user));
	}


	////////////////////////////////////////////////////////////

	function _connect(onConnect) {
		_hueApi = new HueApi(hostname, username);


		_hueApi.connect(function(err, config) {
		    if (err) throw err;
		    onConnect();
		});
	}

	var parseBridges = function(bridges) {
		var bridgeIp = null;

		if (typeof bridges !== 'undefined' && bridges && bridges.length > 0) {
		  console.log(JSON.stringify(bridges));
		  bridge = bridges[0];
		  bridgeIp = _bridge.ipaddress;
		}

		callback({connected:false, bridgeIp:bridgeIp});
	}

	function _locateBridges() {
		hueApi = new hue.HueApi();
		hue.locateBridges().then(parseBridges).done();
	}

	var _parseRegisterUserError = function(err) {
	    console.log('Error ' + err);
	}

	return {
		loadBridge: function(callback) {
			_loadHueBridge(callback); //return whether we are connected
		},

		beginRegistration: function(callback) {
			if (_bridge !== 'undefined') {
				console.log('Registering User with Hue Bridge ' + _bridge.ipaddress);
				_hueApi.registerUser(bridge.ipaddress, null, USER_DESCRIPTION)
				    .then(_saveHueBridgeUser)
				    .fail(_parseRegisterUserError)
				    .done();
			}
		}
	}

}