'use strict';

angular.module('interDromeApp')
  .factory('Bleep', function ($resource) {
    return $resource('/api/bleeps', {
      
    }, { //parameters default
      update: {
        method: 'PUT',
        params: {}
      },
      get: {
        method: 'GET',
        params: {}
      }
	  });
  });