'use strict';

angular.module('interDromeApp')
  .factory('Wemo', function ($resource) {
    return $resource('/api/wemos', {
      
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