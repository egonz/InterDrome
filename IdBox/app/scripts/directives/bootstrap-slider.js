'use strict';

angular.module('interDromeApp')

  /**
   * Bootstrap Slider
   */
  .directive('bootstrapSlider', ['$rootScope', '$parse', function ($rootScope, $parse) {
    var _sliding = false;
    
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
              if(typeof ev.value === 'number') {
                model.assign(scope, ev.value);
                scope.$apply();
              }
            });

            slider.on('slideStart', function(ev) {
                _sliding = true;
            });

            slider.on('slideStop', function(ev) {
                _sliding = false;
            });

            //This is wonky
            scope.$watch(attrs.model, function (newValue, oldValue) {
              var bootstrapSliderTimer = setTimeout(function() {
                if(!$rootScope.$$phase && typeof newValue === 'number'
                   && !_sliding) {
                  slider.slider('setValue', newValue);
                  clearInterval(bootstrapSliderTimer);
                }
              },100);              
            }, true);
        }
   };
}]);