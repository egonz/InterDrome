'use strict';

angular.module('interDromeApp')
  .controller('NotificationCtrl', function ($scope, Notification) {
  	$scope.notifications = Notification.get();
  	$scope.createNotification = false;
  	$scope.newNotification;
  	$scope.alerts = [];

  	$scope.closeAlert = function(index) {
    	$scope.alerts.splice(index, 1);
  	};


  	$scope.create = function() {
  		$scope.newNotification = {};
  		$scope.createNotification = true;

		isSMTPSetup();  		
  	}

  	function isSMTPSetup() {
  		$scope.alerts = [];
  		$scope.alerts.push({ type: 'warning', msg: 'Note: Requires additional setup. Check the Settings Tab above.' });
  	}

  	$scope.cancelCreate = function() {
		$scope.createNotification = false;
  	}

  	$scope.saveNewNotification = function() {
  		console.log("saving new Notification");
  	}

});