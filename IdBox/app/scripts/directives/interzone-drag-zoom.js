'use strict';

angular.module('interDromeApp')

  /**
   * Floor Plan Editor for drawing floor plans over Google Maps
   */
  .directive('interzoneDragZoom', ['$rootScope', function ($rootScope) {

    var margin,
        width,
        height,
        zoom,
        drag,
        svg,
        rect,
        container;

    var _line,
        _points,
        _scope;

    var s, interdromeFloorPlan;


    function redraw() {
      svg.select("path").attr("d", _line);

      if (d3.event) {
        d3.event.preventDefault();
        d3.event.stopPropagation();
      }

      if(!$rootScope.$$phase && !_scope.$$phase) {
        _scope.$apply();
      }
    }

    function zoomed() {
      _scope.pan = d3.event.translate;
      _scope.zoom = d3.event.scale;

      if(!$rootScope.$$phase && !_scope.$$phase) {
        _scope.$apply();
      }

      setZoom(_scope.pan, _scope.zoom);
    }

    function setZoom(pan, zoom) {
      container.attr("transform", "translate(" + pan + ")scale(" + zoom + ")");
    }

    function dragstarted(d) {
      d3.event.sourceEvent.stopPropagation();
      d3.select(this).classed("dragging", true);
    }

    function dragged(d) {
      d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
    }

    function dragended(d) {
      d3.select(this).classed("dragging", false);
    }

    function getCentroid(selection) {
      // get the DOM element from a D3 selection
      // you could also use "this" inside .each()
      var element = selection.node(),
          // use the native SVG interface to get the bounding box
          bbox = element.getBBox();
      // return the center of the bounding box
      return [bbox.x + bbox.width/2, bbox.y + bbox.height/2];
    }

    function rotate(nAngle) {
      interdromeFloorPlan = s.select("#interdrome-floor-plan").transform("r" + nAngle);
    }

    function init(scope, el, attr) {
      margin = {top: -5, right: -5, bottom: -5, left: -5},
        width = scope.width - margin.left - margin.right,
        height = scope.height - margin.top - margin.bottom;

      zoom = d3.behavior.zoom()
          .scaleExtent([1, 10])
          .on("zoom", zoomed);

      drag = d3.behavior.drag()
          .origin(function(d) { return d; })
          .on("dragstart", dragstarted)
          .on("drag", dragged)
          .on("dragend", dragended);

      svg = d3.select(el[0]).append('svg')
          .attr("id", "interdrome-container")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
        .append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.right + ")")
          .call(zoom);

      rect = svg.append("rect")
          .attr("width", width)
          .attr("height", height)
          .style("fill", "none")
          .style("pointer-events", "all");

      container = svg.append("g");

      container.append("g")
          .attr("class", "x axis")
        .selectAll("line")
          .data(d3.range(0, width, 10))
        .enter().append("line")
          .attr("x1", function(d) { return d; })
          .attr("y1", 0)
          .attr("x2", function(d) { return d; })
          .attr("y2", height);

      container.append("g")
          .attr("class", "y axis")
        .selectAll("line")
          .data(d3.range(0, height, 10))
        .enter().append("line")
          .attr("x1", 0)
          .attr("y1", function(d) { return d; })
          .attr("x2", width)
          .attr("y2", function(d) { return d; });

      container.append("g")
        .attr("id", "interdrome-floor-plan")
        .append("path")
        .datum(_points)
        .attr("class", "interzone-line")
        .call(redraw);

      s = Snap("#interdrome-container");

      rotate(scope.angle);

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

      setZoom(_scope.pan, _scope.zoom);

      scope.$watch("angle", function () {
        if (typeof scope.angle === 'number')
          rotate(scope.angle);
      }, true);

      scope.$watch("zoom", function () {
        setZoom(_scope.pan, _scope.zoom);
      }, true);
    }

    function link(scope, el, attr) {
      _scope = scope;
      _points = scope.points;
      _line = d3.svg.line();
      
      scope.internalControl = scope.control || {};
      
      scope.internalControl.clear = function(p) {
      }

      scope.internalControl.reset = function(p) {
        console.log('InterZone Drag Zoom reset called');
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
      scope: { width: '=', height: '=', points: '=', control: '=', 
        angle: '=', pan: '=', zoom: '=' }
    };
  }]);