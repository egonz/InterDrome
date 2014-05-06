'use strict';

angular.module('interDromeApp')

  /**
   * Floor Plan Editor for drawing floor plans over Google Maps
   */
  .directive('interzoneDragZoom', ['$rootScope', '$location', function ($rootScope, $location) {

    var _margin,
        _width,
        _height,
        _zoom,
        _bleepDrag,
        _svg,
        _container,
        _interZone,
        _line,
        _points,
        _bleepZones,
        _scope,
        _s, 
        _interzoneFloorPlan,
        _blurFilter,
        _blurInterval,
        _bleepWidth = 10,
        _bleepHeight = 10,
        _bleepRadius = 5;


    function pulseBlur() {
      _blurFilter.attr("stdDeviation", 1 / 5);

      var blurStdDev = 1;
      var increasing = true;
      var cycles = 0;

      if (typeof _blurInterval !== 'undefined')
        clearInterval(_blurInterval);

      _blurInterval = setInterval(function() {
        if (increasing) {
          _blurFilter.attr("stdDeviation", (blurStdDev += 5) / 5);
        } else {
          _blurFilter.attr("stdDeviation", (blurStdDev -= 5) / 5);
        }

        if (blurStdDev >= 50) {
          increasing = false;
          cycles += 1;
        } else if (blurStdDev <= 5) {
          increasing = true;
        }

        if (cycles >= 3 && increasing) {
          clearInterval(_blurInterval);
          _blurFilter.attr("stdDeviation", 0);
        }
      }, 90);
    }

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

    function zoomed() {
      var dragSrcClassList = d3.event.sourceEvent.srcElement.classList;

      _scope.pan = d3.event.translate;
      _scope.zoom = d3.event.scale;

      if(!$rootScope.$$phase && !_scope.$$phase) {
        _scope.$apply();
      }

      setZoom(_scope.pan, _scope.zoom);      
    }

    function setZoom(pan, zoom) {
      _container.attr("transform", "translate(" + pan + ")scale(" + zoom + ")");
    }

    function bleepDragStarted(d) {
      d3.event.sourceEvent.stopPropagation();
      d3.select(this).classed("dragging", true);
    }

    function bleepDragged(d) {      
      bleep.x = bleep.x || interZoneCenter[0];
      bleep.y = bleep.y || interZoneCenter[1];

      d3.select(this)
        .attr("cx", d.x = Math.max(_bleepRadius, Math.min(_width - _bleepRadius, d3.event.x)))
        .attr("cy", d.y = Math.max(_bleepRadius, Math.min(_height - _bleepRadius, d3.event.y)));
    }

    function bleepDragEnded(d) {
      d3.select(this).classed("dragging", false);
    }

    function getCentroid(selection) {
      var element = selection.node(),
          bbox = element.getBBox();
      return [bbox.x + bbox.width/2, bbox.y + bbox.height/2];
    }

    function rotate(nAngle) {
      _interzoneFloorPlan = _s.select("#interzone-floor-plan").transform("r" + nAngle);
    }

    function addBleep(bleep) {
      var interZoneCenter = getCentroid(_interZone);

      bleep.x = bleep.x || interZoneCenter[0];
      bleep.y = bleep.y || interZoneCenter[1];

      var bleepg = _interZone.append("g")
        .attr("id", bleep._id)
        .data([{x: bleep.x, y: bleep.y}]);

      //TODO move styles to stylesheet

      bleepg.append("circle")
        .attr("class", bleep._id)
        .attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; })
        .attr("r", _bleepRadius)
        .attr("style", "fill:darkred;stroke:darkred;stroke-width:.5;fill-opacity:1;")
        .attr("filter", "url(" + $location.path() + "#blur)");

      var bleepSphere = bleepg.append("circle")
        .attr("class", "bleep " + bleep._id)
        .attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; })
        .attr("r", _bleepRadius)
        .attr("cursor", "move")
        .attr("style", "fill:red;stroke:white;fill-opacity:1;")
        .call(d3.behavior.drag()
          .origin(function(d) { return d; })
          .on("dragstart", bleepDragStarted)
          .on("drag", function(d) {
            bleep.x = Math.max(_bleepRadius, Math.min(_width - _bleepRadius, d3.event.x));
            bleep.y = Math.max(_bleepRadius, Math.min(_height - _bleepRadius, d3.event.y));

            if(!$rootScope.$$phase && !_scope.$$phase) {
              _scope.$apply();
            }

            d3.select($("#" + bleep._id)[0]).selectAll("circle")
              .attr("cx", d.x = bleep.x)
              .attr("cy", d.y = bleep.y);
          })
          .on("dragend", function(d) {pulseBlur();}));

        window.pulseBlur = pulseBlur;

        pulseBlur();
    }

    function init(scope, el, attr) {
      if (typeof _bleepZones === 'undefined') {
        // _scope.bleepZones = [];
        console.log('BleepZones are null')
      } else {
        console.log('BleepZones are NOT null')
      }

      _margin = {top: -5, right: -5, bottom: -5, left: -5},
        _width = scope.width - _margin.left - _margin.right,
        _height = scope.height - _margin.top - _margin.bottom;

      _zoom = d3.behavior.zoom()
          .scaleExtent([1, 10])
          .on("zoom", zoomed);

      _bleepDrag = d3.behavior.drag()
          .origin(function(d) { return d; })
          .on("dragstart", bleepDragStarted)
          .on("drag", bleepDragged)
          .on("dragend", bleepDragEnded);

      _svg = d3.select(el[0]).append('svg')
          .attr("id", "interdrome-container")
          .attr("width", _width + _margin.left + _margin.right)
          .attr("height", _height + _margin.top + _margin.bottom)
        .append("g")
          .attr("transform", "translate(" + _margin.left + "," + _margin.right + ")")
          .call(_zoom);

      _blurFilter = _svg.append("defs")
        .append("filter")
          .attr("id", "blur")
          .attr("filterUnits", "userSpaceOnUse")
        .append("feGaussianBlur")
        .attr("in", "SourceGraphic")
          .attr("stdDeviation", 1);

      _svg.append("rect")
          .attr("width", _width)
          .attr("height", _height)
          .style("fill", "none")
          .style("pointer-events", "all");

      _container = _svg.append("g");

      _container.append("g")
          .attr("class", "x axis")
        .selectAll("line")
          .data(d3.range(0, _width, 10))
        .enter().append("line")
          .attr("x1", function(d) { return d; })
          .attr("y1", 0)
          .attr("x2", function(d) { return d; })
          .attr("y2", _height);

      _container.append("g")
          .attr("class", "y axis")
        .selectAll("line")
          .data(d3.range(0, _height, 10))
        .enter().append("line")
          .attr("x1", 0)
          .attr("y1", function(d) { return d; })
          .attr("x2", _width)
          .attr("y2", function(d) { return d; });

      _interZone = _container.append("g")
        .attr("id", "interzone-floor-plan")
        
      _interZone.append("path")
        .datum(_points)
        .attr("class", "interzone-line")
        .call(redraw);

      _s = Snap("#interdrome-container");

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
      
      scope.internalControl.clear = function() {
      }

      scope.internalControl.addBleep = function(bleep) {
        console.log('Adding BLEEP'); 
        _scope.bleepZones.push(bleep);
        addBleep(bleep);
      }

      scope.internalControl.reset = function(p, bleepZones) {
        console.log('InterZone Drag Zoom reset called');
        d3.select(el[0]).selectAll("svg").remove();
        
        _points = p;
        _bleepZones = bleepZones;

        init(scope, el, attr);
        redraw();
      }

      init(scope, el, attr);
    }

    return {
      link: link,
      restrict: 'E',
      scope: { width: '=', height: '=', points: '=', control: '=', 
        angle: '=', pan: '=', zoom: '=', bleepZones: '=' }
    };
  }]);