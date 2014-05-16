'use strict';

angular.module('interDromeApp')
  .factory('HueLight', function ($resource) {
    return $resource('/api/hue/lights/:id', {
      id: '@id'
    }, { //parameters default
      update: {
        method: 'PUT',
        params: {
          light_id: '@light_id',
          name: '@name',
          bridge: '@bridge'
        }
      },
      get: {
        method: 'GET',
        params: {}
      }
	  });
  });