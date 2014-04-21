'use strict';

angular.module('interDromeApp')
  .controller('BleepCtrl', function ($scope, Bleep) {

  	$scope.data = Bleep.get();
  	$scope.selectedBleep;

  	$scope.editBleep = function(bleep) {
  		$scope.selectedBleep = bleep; 
  	}

  	$scope.itemClass = function(item) {
        return item === $scope.selectedBleep ? 'list-group-item active' : "list-group-item";
    };

});