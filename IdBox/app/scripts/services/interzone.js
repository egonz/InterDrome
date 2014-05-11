'use strict';

angular.module('interDromeApp')
  .factory('InterZone', function ($resource) {
    return $resource('/api/interzones/:id', {
      id: '@id'
    }, { //parameters default
      update: {
        method: 'PUT',
        params: {
          name: '@name',
          loc: '@loc', 
          points: '@points',
          angle: '@angle',
          pan: '@pan',
          zoom: '@zoom',
          default_zone: '@default_zone',
          bleeps: '@bleeps'
        }
      },
      get: {
        method: 'GET',
        params: {}
      }
	  });
  });