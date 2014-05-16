'use strict';

angular.module('interDromeApp')
  .factory('BleepAction', function ($resource) {
    return $resource('/api/bleep/actions/:id', {
      id: '@id'
    }, { //parameters default
      update: {
        method: 'PUT',
        params: {
          bleep: '@bleep',
          hue_light: '@hue_light',
          wemo_device: '@wemo_device',
          pushover_user: '@pushover_user',
          email: '@email',
          event_type: '@event_type',
          action_type: '@action_type',
          control_type: '@control_type'
        }
      },
      get: {
        method: 'GET',
        params: {}
      }
	  });
  });