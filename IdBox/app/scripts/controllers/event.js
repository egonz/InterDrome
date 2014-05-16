'use strict';

angular.module('interDromeApp')
  .controller('EventCtrl', function ($scope, $http, idSocket) {

  	$scope.filterOptions = {
        filterText: "",
        useExternalFilter: true
    }; 

    $scope.totalServerItems = 0;
    
    $scope.pagingOptions = {
        pageSizes: [250, 500, 1000],
        pageSize: 250,
        currentPage: 1
    };

    $scope.$on('socket:bleep-enter', function (ev, data) {
        if (!data.err) {
            $scope.getPagedDataAsync($scope.pagingOptions.pageSize, $scope.pagingOptions.currentPage);
        }
    });

    $scope.$on('socket:bleep-exit', function (ev, data) {
        if (!data.err) {
            $scope.getPagedDataAsync($scope.pagingOptions.pageSize, $scope.pagingOptions.currentPage);
        }
    });

    $scope.setPagingData = function(data, page, pageSize) {
    	var pagedData = data.slice((page - 1) * pageSize, page * pageSize);
        $scope.bleepEventsData = pagedData;
        $scope.totalServerItems = data.length;
        if (!$scope.$$phase) {
            $scope.$apply();
        }
    };

    $scope.getPagedDataAsync = function (pageSize, page, searchText) {
        setTimeout(function () {
            var data;
            if (searchText) {
                var ft = searchText.toLowerCase();
                $http.get('api/bleep/events').success(function (bleepEvents) {		
                    data = bleepEvents.filter(function(item) {
                        return JSON.stringify(item).toLowerCase().indexOf(ft) != -1;
                    });
                    $scope.setPagingData(data, page, pageSize);
                });            
            } else {
                $http.get('api/bleep/events').success(function (bleepEvents) {
                    $scope.setPagingData(bleepEvents, page, pageSize);
                });
            }
        }, 100);
    };

    $scope.formatDate = function (date) {
    	var d = new Date(date);
		var mm = d.getMonth() + 1;
		var hh = d.getHours();
		var m = d.getMinutes();
		var s = d.getSeconds();
		var dd = "AM";
		var h = hh;
		if (h >= 12) {
		  h = hh-12;
		  dd = "PM";
		}
		if (h == 0) {
		  h = 12;
		}
		h = h<10?"0"+h:h;
		m = m<10?"0"+m:m;
		s = s<10?"0"+s:s;
		mm = mm<10?"0"+mm:mm;

		var formattedDateStr = mm + "/" + d.getDate() + "/" + d.getFullYear();

		formattedDateStr += " " + h + ":" + m + ":" + s + " " + dd;

		return formattedDateStr;
    }
	
    $scope.getPagedDataAsync($scope.pagingOptions.pageSize, $scope.pagingOptions.currentPage);
	
    $scope.$watch('pagingOptions', function (newVal, oldVal) {
        if (newVal !== oldVal && newVal.currentPage !== oldVal.currentPage) {
          $scope.getPagedDataAsync($scope.pagingOptions.pageSize, $scope.pagingOptions.currentPage, $scope.filterOptions.filterText);
        }
    }, true);

    $scope.$watch('filterOptions', function (newVal, oldVal) {
        if (newVal !== oldVal) {
          $scope.getPagedDataAsync($scope.pagingOptions.pageSize, $scope.pagingOptions.currentPage, $scope.filterOptions.filterText);
        }
    }, true);
	
    $scope.gridOptions = {
        data: 'bleepEventsData',
        enablePaging: true,
		showFooter: true,
        totalServerItems: 'totalServerItems',
        pagingOptions: $scope.pagingOptions,
        filterOptions: $scope.filterOptions,
        multiSelect: false,
        columnDefs: [{field:'created', displayName:'Created', cellTemplate: '<div class="ngCellText">{{formatDate(row.getProperty(col.field))}}</div>'}, 
        			 {field:'event', displayName:'Event'}, {field:'bleep.name', displayName:'BLEEP'}, 
        			 {field:'beacon.name', displayName:'Beacon'}],
        sortInfo: { fields: ['created'], directions: ['desc']}
    };

});