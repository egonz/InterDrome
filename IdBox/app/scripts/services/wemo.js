'use strict';

angular.module('interDromeApp')
  .factory('Wemo', function ($resource) {
    return $resource('/api/wemos/:id', {
      id: '@id'
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