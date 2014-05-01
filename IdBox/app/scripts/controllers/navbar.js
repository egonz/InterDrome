'use strict';

angular.module('interDromeApp')
  .controller('NavbarCtrl', function ($scope, $location, Auth) {
    $scope.menu = [{
      'title': "Inter.'.Zones",
      'link': '/interzone'
    }, {
      'title': 'Bleeps',
      'link': '/bleeps'
    }, {
      'title': 'Events',
      'link': '/events'
    }, {
      'title': 'Controls',
      'link': '/controls'
    }, {
      'title': 'Notifications',
      'link': '/notifications'
    }, {
      'title': 'Settings',
      'link': '/settings'
    }];
    
    $scope.logout = function() {
      Auth.logout()
      .then(function() {
        $location.path('/login');
      });
    };
    
    $scope.isActive = function(route) {
      return route === $location.path();
    };
  });
