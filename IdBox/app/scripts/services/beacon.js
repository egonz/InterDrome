'use strict';

angular.module('interDromeApp')
  .factory('Beacon', function ($resource) {
    return $resource('/api/beacons', {
      
    }, { //parameters default
      update: {
        method: 'PUT',
        params: {
          id: '@id',
          name: '@name'
        }
      },
      get: {
        method: 'GET',
        params: {}
      }
	  });
  });