'use strict';

angular.module('interDromeApp')
  .factory('Bleep', function ($resource) {
    return $resource('/api/bleeps', {
      
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