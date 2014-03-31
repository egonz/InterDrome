'use strict';

angular.module('interDromeApp')
  .factory('Session', function ($resource) {
    return $resource('/api/session/');
  });
