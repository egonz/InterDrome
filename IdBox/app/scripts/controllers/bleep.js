'use strict';

angular.module('interDromeApp')
  .controller('BleepCtrl', ['$scope', 'Bleep', '$modal', '$log', 'idSocket', 
    'Beacon', 'Notification', '$filter', 'HueLight', 'Wemo', 'BleepAction',
    function ($scope, Bleep, $modal, $log, idSocket, Beacon, Notification, $filter, HueLight, Wemo, BleepAction) {

  	$scope.bleepData = Bleep.get();
  	$scope.selectedBleep;
  	$scope.selectedBeacon;
    $scope.notificationData = Notification.get(setupNotifications);
    $scope.hueLightData = HueLight.get(setupHueLights);
    $scope.wemoData = Wemo.get(setupWemos);
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
      Bleep.get({id: $scope.selectedBleep._id}, setupBleepActions);
  	}

  	$scope.itemClass = function(item) {
        return item === $scope.selectedBleep ? 'list-group-item active' : "list-group-item";
    };

    $scope.beaconItemClass = function(item) {
        return item === $scope.selectedBeacon ? 'list-group-item active' : "list-group-item";
    };

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

    $scope.eventTypes = [
      {value: 'enter', text: 'enter'},
      {value: 'exit', text: 'exit'}
    ];

    $scope.actionTypes = [
      {value: 'notify', text: 'notify'},
      {value: 'turn on', text: 'turn on'},
      {value: 'turn off', text: 'turn off'}
    ];

    $scope.controlTypes = [
      {value: 'Philips Hue', text: 'Philips Hue'},
      {value: 'Wemo', text: 'Wemo'}
    ];

    function pluralize(name) {
      if (name.indexOf(name + "'s") < 0)
        return name + "'s";
      else
        return name;
    }

    function setupBleepActions(bleepData) {
      $scope.bleepActions = [];

      if (typeof bleepData !== 'undefined' && 
          typeof bleepData.bleep !== 'undefined' &&
          typeof bleepData.bleep.actions !== 'undefined') {

        var actions = bleepData.bleep.actions;

        for (var i=0; i<actions.length; i++) {
          var bleepAction = actions[i];

          $scope.inserted = {
            _id: bleepAction._id,
            bleep: $scope.selectedBleep._id,
            event_type: bleepAction.event_type,
            action_type: bleepAction.action_type,
            notification: bleepAction.pushover_user || bleepAction.email,
            control_type: bleepAction.control_type,
            hue_light: bleepAction.hue_light? bleepAction.hue_light._id : undefined,
            wemo_device: bleepAction.wemo_device ? bleepAction.wemo_device._id : undefined
          };

          $scope.bleepActions.push($scope.inserted);
        }
      }
    }

    function setupNotifications(notificationData) {
      $scope.notifications = [];

      if (typeof notificationData !== 'undefined' && 
          typeof notificationData.data !== 'undefined') {

        for (var i=0; i<notificationData.data.length; i++) {
          var notification = {};

          if (notificationData.data[i].email) {
            $scope.notifications.push(
              {value: notificationData.data[i].email, text: notificationData.data[i].email}
            );
          }

          if (notificationData.data[i].pushover_user) {
            $scope.notifications.push(
              {value: notificationData.data[i].pushover_user, text: pluralize(notificationData.data[i].name) + ' Pushover'}
            );
          }
        }
      }
    }

    function setupHueLights(hueLightsData) {
      $scope.hueLights = [];

      console.log('Hue Lights Data ' + JSON.stringify(hueLightsData));

      if (typeof hueLightsData !== 'undefined' && typeof hueLightsData.data !== 'undefined') {
        for (var i=0; i<hueLightsData.data.length; i++ ) {
          $scope.hueLights.push(
            {value: hueLightsData.data[i]._id, text: hueLightsData.data[i].name}
          );
        }
      }
    }

    function setupWemos(wemoData) {
      $scope.wemoLights = [];

      console.log('Wemo Data ' + JSON.stringify(wemoData));

      if (typeof wemoData !== 'undefined' && typeof wemoData.devices !== 'undefined') {
        for (var i=0; i<wemoData.devices.length; i++ ) {
          $scope.wemoLights.push(
            {value: wemoData.devices[i]._id, text: wemoData.devices[i].friendlyName}
          );
        }
      }
    }

    $scope.newAction = function() {
      console.log('New Action');

      $scope.inserted = {
        bleep: $scope.selectedBleep._id,
        event_type: null,
        action_type: null,
        notification: null,
        control_type: null,
        hue_light: null,
        wemo_device: null
      };

      $scope.bleepActions.push($scope.inserted);

      console.log('BLEEP Actions ' + JSON.stringify($scope.bleepActions));
    }

    $scope.notificationName = function(bleepAction) {
      var selected = [];
      if(bleepAction.notification) {
        selected = $filter('filter')($scope.notifications, {value: bleepAction.notification});
      }
      return selected.length ? selected[0].text : 'Notification';
    }

    $scope.hueLightName = function(bleepAction) {
      var selected = [];
      if(bleepAction.hue_light) {
        selected = $filter('filter')($scope.hueLights, {value: bleepAction.hue_light});
      }
      return selected.length ? selected[0].text : 'Light';
    }

    $scope.wemoLightName = function(bleepAction) {
      var selected = [];
      if(bleepAction.wemo_device) {
        selected = $filter('filter')($scope.wemoLights, {value: bleepAction.wemo_device});
      }
      return selected.length ? selected[0].text : 'Light';
    }

    function setNotification(notification, bleepAction) {
      if (typeof notification !== 'undefined' && notification) {
        if (notification.indexOf('@')>0)
          bleepAction.email = notification;
        else
          bleepAction.pushover_user = notification;
      }
    }

    $scope.saveBleep = function() {
      for (var i=0; i<$scope.bleepActions.length; i++) {
        if (typeof $scope.bleepActions[i]._id !== 'undefined') {
          setNotification($scope.bleepActions[i].notification, $scope.bleepActions[i]);
          BleepAction.update({id: $scope.bleepActions[i]._id}, $scope.bleepActions[i]);
        } else {
          setNotification($scope.bleepActions[i].notification, $scope.bleepActions[i]);
          console.log(JSON.stringify($scope.bleepActions[i]));
          BleepAction.save($scope.bleepActions[i]);
        }
      }

      Bleep.update({id:$scope.selectedBleep._id}, {name:$scope.selectedBleep.name});

      $scope.selectedBleep = null;
    }
}]);


var BleepBeaconModalInstanceCtrl = ['$scope', '$modalInstance', 'selectedBeacon', 'Beacon', 'beaconChange',
    function ($scope, $modalInstance, selectedBeacon, Beacon, beaconChange) {
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
}];
