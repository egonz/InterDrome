'use strict';

angular.module('interDromeApp')
  .factory('HueBridge', function ($resource) {
    return $resource('/api/hue/bridges', {
      
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