'use strict';

angular.module('interDromeApp')
  .factory('Bleep', function ($resource) {
    return $resource('/api/bleeps/:id', {
      id: '@id'
    }, { //parameters default
      update: {
        method: 'PUT',
        params: {
          id: '@id',
          name: '@name',
          location: '@location',
          interZone: '@interZone'
        }
      },
      get: {
        method: 'GET',
        params: {}
      }
	  });
  });