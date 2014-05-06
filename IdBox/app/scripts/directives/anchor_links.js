'use strict';

angular.module('interDromeApp')

  /**
   * Supress link clicks for links with an href="" or href="#"
   */
  .directive('a', function() {
    return {
        restrict: 'E',
        link: function(scope, elem, attrs) {
            if(attrs.ngClick || attrs.href === '' || attrs.href === '#'){
              var clazz = $(elem[0]).attr('class');
              if (typeof clazz === 'undefined' || 
                  (typeof clazz !== 'undefined' &&
                   clazz.indexOf('accordion-toggle') < 0)) {

                elem.on('click', function(e){
                    e.preventDefault();
                    if(attrs.ngClick){
                        scope.$eval(attrs.ngClick);
                    }
                });
              }
            }
        }
   };
});