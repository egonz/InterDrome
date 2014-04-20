'use strict';

angular.module('interDromeApp')
  .controller('ControlCtrl', function ($scope, idSocket, HueBridge, $modal, $log) {
  	
  	var modalInstance;

  	$scope.discoverHueBridgeDisabled = false;
  	$scope.hueBridges = HueBridge.get();

  	$scope.$on('socket:hue-bridges', function (ev, data) {
  		console.log('Hue Bridges Discovered ' + JSON.stringify(data));
  		$scope.discoverHueBridgeDisabled = false;
  		$scope.hueBridges = data;
    });

    $scope.discoverHueBridges = function() {
  		console.log('Discovering Hue Bridges');
  		$scope.discoverHueBridgeDisabled = true;
  		idSocket.emit('hue', {action:'discovery'}, function() {
  			console.log('emit callback');
  		});
  	}

  	function registrationComplete(ev, data) {
  		if (! data.err) {
  			$scope.hueBridges = HueBridge.get();
  			modalInstance.dismiss('cancel');
  		}
  	}

	$scope.openHueBidgeModal = function (b) {
		if (typeof b.user === 'undefined') {
			modalInstance = $modal.open({
				templateUrl: 'hue-bridge-modal-register-content',
				controller: HueBridgeRegisterModalInstanceCtrl,
				resolve: {
					socket: function () {
						return idSocket;
					},
					bridge: function() {
						return b;
					},
					registrationComplete: function() {
						return registrationComplete;
					}
				}
			});

		} else {
			modalInstance = $modal.open({
				templateUrl: 'hue-bridge-modal-lights-content',
				controller: HueBridgeLightsModalInstanceCtrl,
				resolve: {
					socket: function () {
						return idSocket;
					},
					bridge: function() {
						return b;
					}
				}
			});
		}

		modalInstance.result.then(function () {
		}, function () {
			$log.info('Modal dismissed at: ' + new Date());
		});
	};

});


// Please note that $modalInstance represents a modal window (instance) dependency.
// It is not the same as the $modal service used above.

var HueBridgeRegisterModalInstanceCtrl = function ($scope, $modalInstance, socket, bridge, registrationComplete) {

	$scope.bridge = bridge;
  	$scope.registerHueBridgeDisabled = false;
  	$scope.alerts = [];

  	$scope.closeAlert = function(index) {
    	$scope.alerts.splice(index, 1);
  	};

  	$scope.$on('socket:hue-bridge-registration-complete', function (ev, data) {
  		console.log('Hue Bridge Registration Complete ' + JSON.stringify(data));
  		
  		if (data.err) {
  			$scope.alerts.push({ type: 'danger', msg: 'Error: ' + data.err.message.capitalize() });
  		}

  		$scope.registerHueBridgeDisabled = false;

  		registrationComplete(ev, data);
    });

  	$scope.register = function () {
    	$scope.alerts = [];
    	$scope.registerHueBridgeDisabled = true;
    	socket.emit('hue', {action:'register', bridge: bridge}, function() {
  			console.log('emit callback');
  		});
  	};

  	$scope.cancel = function () {
    	$modalInstance.dismiss('cancel');
  	};
};

var HueBridgeLightsModalInstanceCtrl = function ($scope, $modalInstance, socket, bridge) {

	$scope.bridge = bridge;
  	$scope.alerts = [];

  	socket.emit('hue', {action:'getLights', bridge: bridge}, function() {
  		console.log('emit callback');
  	});

  	$scope.$on('socket:hue-bridge-get-lights', function (ev, data) {
  		if (data.err) {
  			$scope.alerts.push({ type: 'danger', msg: 'Error: ' + data.err.message.capitalize() });
  		} else {
  			$scope.lights = data.lights;
  		}
  	});

  	$scope.$on('socket:hue-bridge-lights', function (ev, data) {
  		if (data.err) {
  			$scope.alerts.push({ type: 'danger', msg: 'Error: ' + data.err.message.capitalize() });
  		} else {
  			console.log('Hue Bridge Lights Response ' + JSON.stringify(data));
  		}
  	});

  	$scope.closeAlert = function(index) {
    	$scope.alerts.splice(index, 1);
  	};

  	$scope.turnOn = function (lights) {
    	$scope.alerts = [];
    	socket.emit('hue', {action:'on', bridge: bridge, light: lights}, function() {
	  		console.log('emit callback');
	  	});
  	};

  	$scope.turnOff = function (lights) {
    	$scope.alerts = [];
    	socket.emit('hue', {action:'off', bridge: bridge, light: lights}, function() {
	  		console.log('emit callback');
	  	});
  	};

  	$scope.cancel = function () {
    	$modalInstance.dismiss('cancel');
  	};
};