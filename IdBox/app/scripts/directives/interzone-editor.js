'use strict';

angular.module('interDromeApp')

  /**
   * Floor Plan Editor for drawing floor plans over Google Maps
   */
  .directive('interzoneEditor', ['$rootScope', function ($rootScope) {

    var svg,
        dragged, 
        selected,
        line,
        _points,
        width = 960,
        height = 500;

    var _scope;

    function redraw() {
      svg.select("path").attr("d", line);

      var circle = svg.selectAll("circle")
          .data(_points, function(d) { return d; });

      circle.enter().append("circle")
          .attr("r", 1e-6)
          .on("mousedown", function(d) { selected = dragged = d; redraw(); })
        .transition()
          .duration(750)
          .ease("elastic")
          .attr("r", 6.5);

      circle
          .classed("selected", function(d) { return d === selected; })
          .attr("cx", function(d) { return d[0]; })
          .attr("cy", function(d) { return d[1]; });

      circle.exit().remove();

      if (d3.event) {
        d3.event.preventDefault();
        d3.event.stopPropagation();
      }

      if(!$rootScope.$$phase && !_scope.$$phase) {
        _scope.$apply();
      }
    }

    function change() {
      line.interpolate(this.value);
      redraw();
    }

    function mousedown() {
      _points.push(selected = dragged = d3.mouse(svg.node()));
      redraw();
    }

    function mousemove() {
      if (!dragged) return;
      var m = d3.mouse(svg.node());
      dragged[0] = Math.max(0, Math.min(width, m[0]));
      dragged[1] = Math.max(0, Math.min(height, m[1]));
      redraw();
    }

    function mouseup() {
      if (!dragged) return;
      mousemove();
      dragged = null;
    }

    function keydown() {
      if (!selected) return;
      switch (d3.event.keyCode) {
        case 8: // backspace
        case 46: { // delete
          var i = _points.indexOf(selected);
          _points.splice(i, 1);
          selected = _points.length ? _points[i > 0 ? i - 1 : 0] : null;
          redraw();
          break;
        }
      }
    }

    function init(scope, el, attr) {
      width = scope.width;
      height = scope.height;

      dragged = null;
      selected = _points[0];

      line = d3.svg.line();

      svg = d3.select(el[0]).append('svg')
        .attr("width", width)
        .attr("height", height)
        .attr("tabindex", 1);

      svg.append("rect")
        .attr("width", width)
        .attr("height", height)
        .on("mousedown", mousedown);

      svg.append("path")
        .datum(_points)
        .attr("class", "line")
        .call(redraw);

      d3.select(window)
        .on("mousemove", mousemove)
        .on("mouseup", mouseup)
        .on("keydown", keydown);

      d3.select("#interpolate")
        .on("change", change)
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

            svg.node().focus();
    }

    function link(scope, el, attr) {
      _scope = scope;
      _points = scope.points;

      console.log('Creating Interzone Editor');

      scope.internalControl = scope.control || {};

      scope.internalControl.reset = function(p) {
        console.log('InterzoneEditor reset called');
        d3.select(el[0]).selectAll("svg").remove();
        
        _points = p;
        init(scope, el, attr);
        redraw();
      }

      scope.internalControl.clear = function() {
        for (var i = 0; i < _points.length; i ++) {
          _points.splice(i, 1);
          selected = _points.length ? _points[i > 0 ? i - 1 : 0] : null;
        }
        if (_points.length >= 0)
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