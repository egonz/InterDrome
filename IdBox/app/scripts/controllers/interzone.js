'use strict';

angular.module('interDromeApp').controller('InterZoneCtrl', function ($scope, $rootScope, $http, 
        idSocket, InterZone, BootstrapGrowl) {
    
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
    $scope.interZonePoints;

    $scope.lastView = {
        map: false,
        selectedView: false
    };

    $scope.angle;
    $scope.pan;
    $scope.zoom;

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

    var bootstrapGrowlOptions = {ele: '#bootstrap-growl'};

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

    $scope.$watch("interZone.angle", function (newValue, oldValue) {
        if (oldValue !== -1) {
            $scope.interZone.dirty = true;
        }
    });
    $scope.$watch("interZone.points", function (newValue, oldValue) {
        if (oldValue.length !== 0) {
            $scope.interZone.dirty = true;
        }
    });
    $scope.$watch("interZone.pan", function (newValue, oldValue) {
        if (oldValue !== -1) {
            $scope.interZone.dirty = true;
        }
    });
    $scope.$watch("interZone.zoom", function (newValue, oldValue) {
        if (oldValue !== -1) {
            $scope.interZone.dirty = true;
        }
    });

    function newInterZoneInstance() {
        $scope.interZone = {
            name: "",
            loc: {
                latitude: 37.7749295,
                longitude: -122.41941550000001
            },
            points: [],
            angle: -1,
            pan: -1,
            zoom: -1,
            default_zone: false,
            dirty: false,
            newInstance: true
        };
    }

    function loadInterZones(selectedName) {
        console.log('Loading InterZones. Selecting Name: ' + selectedName);
        var izData = InterZone.get(function(izData) {
            izData.interZones.unshift({_id:"", name:""});
            $scope.interZoneData = izData;

            if (typeof selectedName !== 'undefined') {
                for (var i = 0; i < $scope.interZoneData.interZones.length; i++) {
                    if ($scope.interZoneData.interZones[i].name == selectedName) {
                        $scope.interZone = $scope.interZoneData.interZones[i];
                        if ($scope.interZoneControl.reset !== 'undefined') {
                            try {
                                $scope.interZoneControl.reset($scope.interZone.points);
                            } catch (e) {}
                        }
                        return;
                    }
                }
            }

            // $scope.interZoneDataClean = JSON.parse(JSON.stringify(bleep))
        });
    }

    function init() {
        loadInterZones();
        newInterZoneInstance();

        $scope.interZoneEditInfo = false;
        $scope.newInterZone = false;
        $scope.showMap = false;

        $scope.autocomplete = undefined;
    }

    function saveComplete() {
        BootstrapGrowl.success('InterZone Saved', bootstrapGrowlOptions);
        
        console.log(JSON.stringify($scope.interZone));

        loadInterZones($scope.interZone.name);
        
        $scope.interZone.dirty = false;
        $scope.interZoneEditInfo = true;
        $scope.interZoneView = true;
        $scope.newInterZone = false;
    }

    $scope.createInterZone = function() {
        $scope.lastView.map = true;
        $scope.lastView.selectedView = false;

        newInterZoneInstance();
        $scope.newInterZone = true;
        $scope.interZoneEditInfo = false;
        $scope.interZoneView = false;
        $scope.showMap = false;
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

        $scope.interZone.dirty = false;
    }

	$scope.editInterZone = function() {
		$scope.showMap = true;
        $scope.interZoneEdit = true;
        $scope.interZoneView = false;
        
        var mapRefreshTimeout = setTimeout(function() {
            $scope.mapControl.refresh($scope.interZone.loc);
            $scope.map.zoom = 24;
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
            BootstrapGrowl.error('Error: InterZone Name Required.', bootstrapGrowlOptions);
        } else if ($scope.interZone.points.length === 0) {
            BootstrapGrowl.error('Error: InterZone Floor Plan Required.', bootstrapGrowlOptions);
        } else {
            $scope.showMap = false;
            $scope.interZoneEdit = false;

            if (typeof $scope.interZone._id !== 'undefined') {
                var interZone = InterZone.get({id:$scope.interZone._id}, function(interZone) {
                    console.log('InterZone found with id ' + interZone._id);
                    interZone.name = $scope.interZone.name;
                    interZone.angle = $scope.interZone.angle;
                    interZone.pan = $scope.interZone.pan;
                    interZone.zoom = $scope.interZone.zoom;
                    interZone.default_zone = $scope.interZone.default_zone;
                    interZone.points = $scope.interZone.points;

                    console.log('Updating InterZone to: ' + JSON.stringify(interZone));

                    interZone.$update({ id:interZone._id }, function(data) {
                        console.log("saveInterZone update callback");
                        saveComplete();
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
        
        $scope.interZone.angle = 0;
        $scope.interZone.pan = [0,0];
        $scope.interZone.zoom = 1;

        InterZone.save($scope.interZone, function(data, headers) {
            console.log("saveInterZone save callback");
            // $scope.interZone = data;
            saveComplete();
        }, function(data,headers) {
            BootstrapGrowl.error('Error saving InterZone; ' + data, bootstrapGrowlOptions);             
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

    init();
});