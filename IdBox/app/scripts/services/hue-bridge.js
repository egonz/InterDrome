'use strict';

angular.module('interDromeApp')
  .factory('HueBridge', function ($resource) {
    return $resource('/api/hue/bridges', {
      
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