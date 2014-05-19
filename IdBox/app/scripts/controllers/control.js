'use strict';

angular.module('interDromeApp')
  .controller('ControlCtrl', ['$scope', 'idSocket', 'HueBridge', 'Wemo', '$modal', '$log', 
    function ($scope, idSocket, HueBridge, Wemo, $modal, $log) {
  	
  	var modalInstance;

  	$scope.discoverHueBridgeDisabled = false;
    $scope.discoverWemoDevicesDisabled = false;
  	$scope.hueBridges = HueBridge.get();
    $scope.wemo;// = Wemo.get();

  	$scope.$on('socket:hue-bridges', function (ev, data) {
  		console.log('Hue Bridges Discovered ' + JSON.stringify(data));
  		$scope.discoverHueBridgeDisabled = false;
  		$scope.hueBridges = data;
    });

    $scope.$on('socket:wemo-found', function (ev, data) {
      console.log('Wemo Device Discovered ' + JSON.stringify(data));

      if (typeof $scope.wemo !== 'undefined' && 
          typeof $scope.wemo.devices !== 'undefined') {
        for (var i = 0; i < $scope.wemo.devices.length; i++) {
          if ($scope.wemo.devices[i].ip === data.ip) {
            console.log('Wemo Already Found');
            $scope.discoverWemoDevicesDisabled = false;
            return;
          }
        }

        $scope.wemo.devices.push(data);
        $scope.$digest();
      } else {
        $scope.wemo = {
          devices: []
        };
        $scope.wemo.devices.push(data);
        $scope.$digest();
      }

      $scope.discoverWemoDevicesDisabled = false;
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
					selectedBridge: function() {
						return b;
					},
          HueBridge: function() {
            return HueBridge;
          }
				}
			});
		}

		modalInstance.result.then(function () {
		}, function () {
			$log.info('Modal dismissed at: ' + new Date());
		});
  }

  $scope.openWemoDeviceModal = function (wd) {
    modalInstance = $modal.open({
      templateUrl: 'wemo-device-content',
      controller: WemoDeviceModalInstanceCtrl,
      resolve: {
        socket: function () {
          return idSocket;
        },
        wemoDevice: function() {
          return wd;
        }
      }
    });
    
    modalInstance.result.then(function () {
    }, function () {
      $log.info('Modal dismissed at: ' + new Date());
    });
  }

  $scope.discoverWemoDevices = function() {
    console.log('Discovering Wemo Devices');
    $scope.discoverWemoDevicesDisabled = true;
    idSocket.emit('wemo', {action:'discovery'}, function() {
      console.log('emit callback');
    });

    setTimeout(function() {
      if ($scope.discoverWemoDevicesDisabled) {
        console.log('Re-enabling Wemo Device Search');
        $scope.discoverWemoDevicesDisabled = false;
        $scope.$digest();
      }
    }, 10000);
  }

}]);


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

var HueBridgeLightsModalInstanceCtrl = function ($scope, $modalInstance, socket, selectedBridge, HueBridge) {

	$scope.bridge = selectedBridge;
  $scope.alerts = [];
  $scope.hueBridgeName;

  	socket.emit('hue', {action:'getLights', bridge: selectedBridge}, function() {
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

    $scope.setHueBridgeName = function(keyCode) {
      if (keyCode == 13) {
        HueBridge.update({
          id: $scope.bridge._id, 
          name: $scope.bridge.name
        });
      }
    }

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


var WemoDeviceModalInstanceCtrl = function ($scope, $modalInstance, socket, wemoDevice) {

    $scope.alerts = [];
    $scope.wemoDevice = wemoDevice;

    $scope.$on('socket:wemo-set-binary-state-result', function (ev, data) {
      console.log(JSON.stringify(data));
      if (data.err) {
        $scope.alerts.push({ type: 'danger', msg: 'Error: ' + data.err.code.capitalize() });
      }
    });
    
    $scope.closeAlert = function(index) {
      $scope.alerts.splice(index, 1);
    };

    $scope.turnOn = function (lights) {
      $scope.alerts = [];
      socket.emit('wemo', {action:'on', wemoDevice: wemoDevice}, function() {
        console.log('emit callback');
      });
    };

    $scope.turnOff = function (lights) {
      $scope.alerts = [];
      socket.emit('wemo', {action:'off', wemoDevice: wemoDevice}, function() {
        console.log('emit callback');
      });
    };

    $scope.cancel = function () {
      $modalInstance.dismiss('cancel');
    };
};