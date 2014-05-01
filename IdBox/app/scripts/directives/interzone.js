'use strict';

angular.module('interDromeApp')

  /**
   * Floor Plan Editor for drawing floor plans over Google Maps
   */
  .directive('interzone', ['$rootScope', function ($rootScope) {

    var _svg,
        _line,
        _width = 960,
        _height = 500,
        _points,
        _scope;

    function redraw() {
      _svg.select("path").attr("d", _line);

      if (d3.event) {
        d3.event.preventDefault();
        d3.event.stopPropagation();
      }

      if(!$rootScope.$$phase && !_scope.$$phase) {
        _scope.$apply();
      }
    }

    function scale() {
      
    }

    function init(scope, el, attr) {
      console.log('Creating D3 Interzone SVG Map');

      scale();

      _line = d3.svg.line();

      _svg = d3.select(el[0]).append('svg')
        .attr("width", _width)
        .attr("height", _height)
        .attr("tabindex", 1);

      _svg.append("rect")
        .attr("width", _width)
        .attr("height", _height);

      _svg.append("path")
        .datum(_points)
        .attr("class", "line")
        .call(redraw);

      d3.select("#interpolate")
        .selectAll("option")
          .data([
            "linear",
            "step-before",
            "step-after",
            "basis",
            "basis-open",
            "basis-closed",
            "cardinal",
            "cardinal-open",
            "cardinal-closed",
            "monotone"
          ])
        .enter().append("option")
          .attr("value", function(d) { return d; })
          .text(function(d) { return d; });

        _svg.node().focus();
    }

    function link(scope, el, attr) {
      _scope = scope;
      _width = scope.width;
      _height = scope.height;
      _points = scope.points;
      
      scope.internalControl = scope.control || {};
      scope.internalControl.reset = function(p) {
        console.log('reset called');
        d3.select(el[0]).selectAll("svg").remove();
        
        _points = p;
        init(scope, el, attr);
        redraw();
      }

      init(scope, el, attr);
    }

    return {
      link: link,
      restrict: 'E',
      scope: { width: '=', height: '=', points: '=', control: '=' }
    };
  }]);