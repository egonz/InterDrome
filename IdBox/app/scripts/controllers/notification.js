'use strict';

angular.module('interDromeApp')
  .controller('NotificationCtrl', function ($scope, Notification, BootstrapGrowl) {
  	$scope.notifications = Notification.get();
  	$scope.notification;
  	$scope.alerts = [];

    var bootstrapGrowlOptions = {ele: '#notification-bootstrap-growl'};

    function isSMTPSetup() {
      $scope.alerts = [];
      $scope.alerts.push({ type: 'warning', msg: 'Note: Email requires additional setup. Check the Settings Tab above.' });
    }

  	$scope.closeAlert = function(index) {
    	$scope.alerts.splice(index, 1);
  	};

  	$scope.create = function() {
  		$scope.notification = {};
		  isSMTPSetup();
  	}

    $scope.edit = function(notification) {
      $scope.notification = notification;
    }

  	$scope.cancel = function() {
		  $scope.notification = undefined;
  	}

    $scope.itemClass = function(item) {
        return item === $scope.notification ? 'list-group-item active' : "list-group-item";
    };

  	$scope.save = function(data, headers) {
      console.log("Saving Notification");
      console.log($scope.notification);

  		if (typeof $scope.notification._id !== 'undefined') {
        Notification.update({id:$scope.notification._id}, $scope.notification, function(err, notification) {
          BootstrapGrowl.success('Notification Saved.', bootstrapGrowlOptions);
          $scope.notification = undefined;
        }, function(data,headers) {
          BootstrapGrowl.error('Error saving Notification; ' + data, bootstrapGrowlOptions);
        });
      } else {
        Notification.save($scope.notification, function(err, notification) {
          BootstrapGrowl.success('Notification Saved.', bootstrapGrowlOptions);
          $scope.notification = undefined;
        }, function(data,headers) {
          BootstrapGrowl.error('Error saving Notification; ' + data, bootstrapGrowlOptions);
        });
      }
  	}

});