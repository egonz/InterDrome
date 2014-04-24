'use strict';

angular.module('interDromeApp')
  .controller('BleepCtrl', function ($scope, Bleep, $modal, $log, idSocket, Beacon) {

  	$scope.bleepData = Bleep.get();
  	$scope.selectedBleepRef;
  	$scope.selectedBleep;
  	$scope.selectedBeacon;
  	$scope.bleepChanged = false;
  	var modalInstance;

  	$scope.$on('socket:bleep-enter', function (ev, data) {
  		if (!data.err) {
  			console.log('BLEEP Enter');
  			updateBeacons(data);
  		}
  	});

  	$scope.$on('socket:bleep-exit', function (ev, data) {
  		if (!data.err) {
  			console.log('BLEEP Exit');
  			updateBeacons(data);
  		}
  	});

  	function updateBeacons(data) {
  		if (typeof $scope.bleepData.bleeps !== 'undefined') {
  			var bleeps = $scope.bleepData.bleeps;
  			for (var i = 0; i < bleeps.length; i++) {
  				console.log('Does ' + bleeps[i].address + ' equal ' + data.bleep.address);
  				if (bleeps[i].address === data.bleep.address) {
  					$scope.bleepData.bleeps[i].beacons = data.bleep.beacons;
  					$scope.$digest();
  					return;
  				}
  			}
  		} else {
  			$scope.bleepData = Bleep.get();
  		}
  	}

  	$scope.editBleep = function(bleep) {
  		$scope.selectedBleep = bleep;
  		$scope.selectedBleepRef = JSON.parse(JSON.stringify(bleep));
  	}

  	$scope.itemClass = function(item) {
        return item === $scope.selectedBleep ? 'list-group-item active' : "list-group-item";
    };

    $scope.beaconItemClass = function(item) {
        return item === $scope.selectedBeacon ? 'list-group-item active' : "list-group-item";
    };

    $scope.setBleepChanged = function() {
    	if ($scope.selectedBleep.name !== $scope.selectedBleepRef.name) {
    		$scope.bleepChanged = true;
    	} else {
    		$scope.bleepChanged = false;
    	} 
    }

    $scope.saveBleep = function() {
    	Bleep.update({
    		id: $scope.selectedBleep._id, 
    		name: $scope.selectedBleep.name
    	});
    	$scope.selectedBleepRef = JSON.parse(JSON.stringify($scope.selectedBleep));
    	$scope.bleepChanged = false;
    }

    $scope.showBeacon = function(beacon) {
    	$scope.selectedBeacon = beacon;

    	if (typeof modalInstance === 'undefined') {
	    	modalInstance = $modal.open({
				templateUrl: 'bleep-beacon-modal-content',
				controller: BleepBeaconModalInstanceCtrl,
				resolve: {
					selectedBeacon: function() {
						return $scope.selectedBeacon;
					},

					socket: function () {
						return idSocket;
					},

					beacon: function() {
						return Beacon;
					},

					beaconChange: function() {
						return beaconChange;
					}
				}
			});

	    	modalInstance.result.then(function () {
			}, function () {
				modalInstance = undefined;
				$log.info('Modal dismissed at: ' + new Date());
			});
		}
    }

    function beaconChange(beacon) {
    	$scope.selectedBeacon.name = beacon.name;
    }

});


var BleepBeaconModalInstanceCtrl = function ($scope, $modalInstance, selectedBeacon, Beacon, beaconChange) {
	$scope.selectedBeacon = JSON.parse(JSON.stringify(selectedBeacon));
	$scope.selectedBeaconRef = JSON.parse(JSON.stringify(selectedBeacon));
	$scope.beaconChanged = false;

	$scope.setBeaconChanged = function() {
		if ($scope.selectedBeacon.name !== $scope.selectedBeaconRef.name) {
    		$scope.beaconChanged = true;
    	} else {
    		$scope.beaconChanged = false;
    	}
  	};

	$scope.close = function () {
    	$modalInstance.dismiss('cancel');
  	};

  	$scope.save = function () {
  		Beacon.update({
    		id: selectedBeacon._id, 
    		name: $scope.selectedBeacon.name
    	});

    	$scope.selectedBeaconRef = JSON.parse(JSON.stringify(selectedBeacon));
    	$scope.beaconChanged = false;

    	beaconChange($scope.selectedBeacon);
  	};
}
