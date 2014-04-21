'use strict';

angular.module('interDromeApp', [
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'ngRoute',
  'google-maps',
  'ngAutocomplete',
  'btford.socket-io',
  'ui.bootstrap'
])
  .factory('idSocket', function (socketFactory) {
    console.log('Creating Socket.io connection factory');
    var mySocket = socketFactory();
    mySocket.forward('connected');
    mySocket.forward('bleep-enter');
    mySocket.forward('bleep-exit');
    mySocket.forward('hue-bridges');
    mySocket.forward('hue-bridge-registration-complete');
    mySocket.forward('hue-bridge-get-lights');
    mySocket.forward('hue-bridge-lights');
    mySocket.forward('wemo-discovery');
    mySocket.forward('xbee');

    return mySocket;
  })
  .config(function ($routeProvider, $locationProvider, $httpProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'partials/main',
        controller: 'MainCtrl',
        authenticate: true
      })
      .when('/login', {
        templateUrl: 'partials/login',
        controller: 'LoginCtrl'
      })
      .when('/adduser', {
        templateUrl: 'partials/adduser',
        controller: 'AddUserCtrl'
      })
      .when('/settings', {
        templateUrl: 'partials/settings',
        controller: 'SettingsCtrl',
        authenticate: true
      })
      .when('/interzone', {
        templateUrl: 'partials/interzone',
        controller: 'InterZoneCtrl',
        authenticate: true
      })
      .when('/controls', {
        templateUrl: 'partials/controls',
        controller: 'ControlCtrl',
        authenticate: true
      })
      .when('/bleeps', {
        templateUrl: 'partials/bleep',
        controller: 'BleepCtrl',
        authenticate: true
      })
      .when('/events', {
        templateUrl: 'partials/events',
        controller: 'EventCtrl',
        authenticate: true
      })
      .when('/notifications', {
        templateUrl: 'partials/notifications',
        controller: 'NotificationCtrl',
        authenticate: true
      })
      .otherwise({
        redirectTo: '/'
      });
      
    $locationProvider.html5Mode(true);
      
    // Intercept 401s and redirect you to login
    $httpProvider.interceptors.push(['$q', '$location', function($q, $location) {
      return {
        'responseError': function(response) {
          if(response.status === 401) {
            $location.path('/login');
            return $q.reject(response);
          }
          else {
            return $q.reject(response);
          }
        }
      };
    }]);
  })
  .run(function ($rootScope, $location, Auth) {

    // Redirect to login if route requires auth and you're not logged in
    $rootScope.$on('$routeChangeStart', function (event, next) {
      
      if (next.authenticate && !Auth.isLoggedIn()) {
        $location.path('/login');
      }
    });
  });

  String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
  }