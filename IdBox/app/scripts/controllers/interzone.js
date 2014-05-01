'use strict';

angular.module('interDromeApp').controller('InterZoneCtrl', function ($scope, $rootScope, $http, 
        idSocket, InterZone) {
    
    $scope.debug = true;
    $scope.width = 1024;
    $scope.height = 468;
    $scope.interZoneEdit = false;
    $scope.interZoneWidth = 1024;
    $scope.interZoneHeight = 468;
    $scope.interZoneEditInfo = false;
    $scope.newInterZone = false;
    $scope.showMap = false;
    $scope.interZoneControl = {};
    $scope.interZoneEditorControl = {};
    $scope.mapControl = {};
    $scope.alert;
    $scope.interZonePoints;

    $scope.lastView = {
        map: false,
        selectedView: false
    };

    $scope.angle = 316;
    $scope.pan = [-312.0016234354316,-115.4506741956165];
    $scope.zoom = 1.584514132467325;

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

    //Listen for Google Places data
    $scope.$watch("details.geometry", function () {
        if (typeof $scope.details !== 'undefined') {
            $scope.interZone.loc.latitude = $scope.details.geometry.location.k;
            $scope.interZone.loc.longitude = $scope.details.geometry.location.A;
            $scope.showMap = true;
            $scope.interZoneEditInfo = true;

            console.log('autocomplete' + $scope.autocomplete);
        }
    }, true);

    function newInterZoneInstance() {
        $scope.interZone = {
            name: "",
            loc: {
                latitude: 37.7749295,
                longitude: -122.41941550000001
            },
            points: []
        };
    }

    function loadInterZones() {
        var izData = InterZone.get(function(izData) {
            izData.interZones.unshift({_id:"", name:""});
            $scope.interZoneData = izData;
        });
    }

    function init() {
        loadInterZones();
        newInterZoneInstance();

        $scope.interZoneEditInfo = false;
        $scope.newInterZone = false;
        $scope.showMap = false;
        $scope.alert = undefined;

        $scope.autocomplete = undefined;
    }

    function createDangerAlert(msg) {
        $scope.alert = { type: 'danger', msg: msg};
    }

    function saveComplete() {
        $scope.alert = { type: 'success', msg: 'InterZone Floor Plan Created'};
        init();
    }

    $scope.createInterZone = function() {
        $scope.lastView.map = true;
        $scope.lastView.selectedView = false;

        newInterZoneInstance();
        $scope.newInterZone = true;
        $scope.interZoneEditInfo = false;
        $scope.interZoneView = false;
        $scope.showMap = false;
        $scope.alert = undefined;
        $scope.autocomplete = undefined;
        $scope.details = undefined;

        $scope.interZonePoints = $scope.interZone.points;
    }

    $scope.interZoneSelected = function() {
        console.log('Editing ' + JSON.stringify($scope.interZone));

        $scope.lastView.map = false;
        $scope.lastView.selectedView = true;
        
        $scope.newInterZone = false;
        $scope.interZoneEditInfo = true;
        $scope.interZoneEdit = false;
        $scope.showMap = false;
        $scope.interZoneView = true;
        $scope.autocomplete = undefined;
        $scope.details = undefined;

        $scope.interZonePoints = $scope.interZone.points;

        if ($scope.interZoneControl.reset !== 'undefined') {
            try {
                $scope.interZoneControl.reset($scope.interZone.points);
            } catch (e) {}
        }

        if ($scope.interZoneEditorControl.reset !== 'undefined') {
            try {
                $scope.interZoneEditorControl.reset($scope.interZone.points);
            } catch (e) {}
        }
    }

	$scope.editInterZone = function() {
		$scope.showMap = true;
        $scope.interZoneEdit = true;
        $scope.interZoneView = false;
        
        var mapRefreshTimeout = setTimeout(function() {
            $scope.mapControl.refresh($scope.interZone.loc);
        }, 100);
	}

    $scope.cancelEdit = function() {
        $scope.interZoneEdit = false;

        if ($scope.lastView.map) {

        } else if ($scope.lastView.selectedView) {
            $scope.interZoneEditInfo = true;
            $scope.interZoneView = true;
            $scope.showMap = false;
        }
    }

	$scope.saveInterZone = function() {
        if ($scope.interZone.name.length === 0) {
            createDangerAlert('Error: InterZone Name Required.');
        } else if ($scope.interZone.points.length === 0) {
            createDangerAlert('Error: InterZone Floor Plan Required.');
        } else {
            $scope.showMap = false;
            $scope.interZoneEdit = false;

            if (typeof $scope.interZone._id !== 'undefined') {
                var interZone = InterZone.get({id:$scope.interZone._id}, function(interZone) {
                    console.log('InterZone found with id ' + interZone._id);
                    interZone.name = $scope.interZone.name;
                    interZone.points = $scope.interZone.points;
                    interZone.$update(function(data) {
                        console.log("saveInterZone update callback");
                        init();
                    });
                }, function(err) {
                    saveNewInterZoneInstance();
                });
            } else {
                saveNewInterZoneInstance();
            }
        }
	}

    function saveNewInterZoneInstance() {
        console.log('InterZone not found. Creating new Zone.');
        
        InterZone.save($scope.interZone, function(data, headers) {
            console.log("saveInterZone save callback");
            $scope.interZone = data;
            saveComplete();
        }, function(data,headers) {
            createDangerAlert('Error saving InterZone; ' + data);             
        });
    }

    $scope.clearInterZone = function() {
        $scope.interZoneEditorControl.clear();
    }

    $scope.hideMap = function() {
        $scope.showMap = false;
    }

    $scope.checkName = function(data) {
        console.log('Checking name ' + data);
    }

    $scope.closeAlert = function(index) {
        $scope.alert = undefined;
    };

    init();
});