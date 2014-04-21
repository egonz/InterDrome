'use strict';

angular.module('interDromeApp').controller('InterZoneCtrl', function ($scope, $http, idSocket) {
    $scope.width = 960;
    $scope.height = 500;
    $scope.showFloorPlan = false;

    $scope.$on('socket:bleep-enter', function (ev, data) {
  		console.log('BLEEP Enter ' + JSON.stringify(data));
    });

    $scope.$on('socket:bleep-exit', function (ev, data) {
  		console.log('BLEEP Exit ' + JSON.stringify(data));
    });

    var mapOptions = {
        panControl    : true,
        zoomControl   : true,
        scaleControl  : true,
        mapTypeControl: false,
        mapTypeId     : google.maps.MapTypeId.SATELLITE,
        tilt          : 0
    };

    $scope.map = {
	    zoom: 24,
        options: mapOptions
	};

	$scope.editFloorPlan = function() {
		$scope.showFloorPlan = true;
	}

	$scope.saveFloorPlan = function() {
		$scope.showFloorPlan = false;
	}

	var points = d3.range(1, 5).map(function(i) {
	  return [i * $scope.width / 5, 50 + Math.random() * ($scope.height - 100)];
	});

	var dragged = null,
	    selected = points[0];

	var line = d3.svg.line();

	var svg = d3.select("#floorplan").append("svg")
	    .attr("width", $scope.width - 20)
	    .attr("height", $scope.height - 20)
	    .attr("tabindex", 1);
});