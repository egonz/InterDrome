'use strict';

angular.module('interDromeApp')
  .factory('Notification', function ($resource) {
    return $resource('/api/notifications/:id', {
      id: '@id'
    }, { //parameters default
      update: {
        method: 'PUT',
        params: {
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