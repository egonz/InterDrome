'use strict';

angular.module('interDromeApp')
  .factory('Wemo', function ($resource) {
    return $resource('/api/wemo', {
      
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