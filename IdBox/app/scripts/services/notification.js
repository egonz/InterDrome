'use strict';

angular.module('interDromeApp')
  .factory('Notification', function ($resource) {
    return $resource('/api/notifications', {
      
    }, { //parameters default
      update: {
        method: 'PUT',
        params: {
          id: '@id',
          name: '@name',
          pushover_user: '@pushover_user',
          email: '@email'
        }
      },
      get: {
        method: 'GET',
        params: {}
      }
	  });
  });