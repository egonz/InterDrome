'use strict';

angular.module('interDromeApp')

  /**
   * Bootstrap Slider
   */
  .directive('bootstrapSlider', ['$rootScope', '$parse', function ($rootScope, $parse) {
    return {
        restrict: 'E',
        replace: true,
        template: '<input type="text" />',
        link: function(scope, elem, attrs) {
            var model = $parse(attrs.model);

            if (typeof attrs.handle !== undefined)
              var slider = $(elem[0]).slider({handle:attrs.handle, value:attrs.bootstrapSliderValue});
            else
              var slider = $(elem[0]).slider();

            slider.on('slide', function(ev) {
                model.assign(scope, ev.value);
                scope.$apply();
            });

            //This is wonky
            scope.$watch(attrs.model, function (newValue, oldValue) {
              if(!$rootScope.$$phase) {
                slider.slider('setValue', newValue);
              }
            }, true);
        }
   };
}]);