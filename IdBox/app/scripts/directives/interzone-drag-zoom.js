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
        _svg,
        _container,
        _interZone,
        _line,
        _points,
        _scope,
        _s, 
        _interzoneFloorPlan,
        _bleepSpheres = {},
        _bleepBlurFilters = {},
        _bleepWidth = 10,
        _bleepHeight = 10,
        _bleepRadius = 5;

    var SMALL = "rsmall", MEDIUM = "rmedium", LARGE = "rlarge";

    function pulseBlur(id) {
      var blurFilter = _bleepBlurFilters[id].filter;
      var blurStdDev = 1;
      var increasing = true;
      var cycles = 0;

      blurFilter.attr("stdDeviation", 1 / 5);

      if (typeof _bleepBlurFilters[id].interval !== 'undefined')
        clearInterval(_bleepBlurFilters[id].interval);

      _bleepBlurFilters[id].interval = setInterval(function() {
        if (increasing) {
          blurFilter.attr("stdDeviation", (blurStdDev += 5) / 5);
        } else {
          blurFilter.attr("stdDeviation", (blurStdDev -= 5) / 5);
        }

        if (blurStdDev >= 50) {
          increasing = false;
          cycles += 1;
        } else if (blurStdDev <= 5) {
          increasing = true;
        }

        if (cycles >= 3 && increasing) {
          clearInterval(_bleepBlurFilters[id].interval);
          blurFilter.attr("stdDeviation", 0);
        }
      }, 90);
    }

    //TODO is this needed? Can it be moved into init?
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

    function getCentroid(selection) {
      var element = selection.node(),
          bbox = element.getBBox();
      return [bbox.x + bbox.width/2, bbox.y + bbox.height/2];
    }

    function rotate(nAngle) {
      _interzoneFloorPlan = _s.select("#interzone-floor-plan").transform("r" + nAngle);
    }

    //////////////////////////////////////////////////////////////////////
    // BLEEP                                                            //
    //////////////////////////////////////////////////////////////////////

    function addBleep(bleep) {
      var interZoneCenter = getCentroid(_interZone);

      console.log('InterZone Center ' + JSON.stringify(interZoneCenter));

      if (typeof bleep.location === 'undefined')
        bleep.location = {};

      bleep.location.x = bleep.location.x || interZoneCenter[0];
      bleep.location.y = bleep.location.y || interZoneCenter[1];

      if (!(bleep._id in _bleepBlurFilters)) {
        var blurFilter = _svg.select("defs")
          .append("filter")
            .attr("id", "blur-" + bleep._id)
            .attr("filterUnits", "userSpaceOnUse")
          .append("feGaussianBlur")
          .attr("in", "SourceGraphic")
            .attr("stdDeviation", 1);

        _bleepBlurFilters[bleep._id] = {};
        _bleepBlurFilters[bleep._id].filter = blurFilter;
      }

      if (!(bleep._id in _bleepSpheres)) {
        var bleepg = _interZone.append("g")
          .attr("id", bleep._id)
          .data([{x: bleep.location.x, y: bleep.location.y}]);

        //TODO move styles to stylesheet

        bleepg.append("circle")
          .attr("class", bleep._id)
          .attr("cx", function(d) { return d.x; })
          .attr("cy", function(d) { return d.y; })
          .attr("r", _bleepRadius)
          .attr("style", "fill:darkred;stroke:darkred;stroke-width:.5;fill-opacity:1;")
          .attr("filter", "url(" + $location.path() + "#blur-" + bleep._id + ")");

        var bleepSphere = bleepg.append("circle")
          .attr("id", "bleep-" + bleep._id)
          .attr("class", "bleep")
          .attr("cx", function(d) { return d.x; })
          .attr("cy", function(d) { return d.y; })
          .attr("r", _bleepRadius)
          .attr("cursor", "move")
          .attr("style", "fill:red;stroke:white;fill-opacity:1;stroke-width:1;")
          .attr("data-container","body")
          .attr("data-toggle", "popover")
          .attr("data-placement", "right")
          .attr("data-content", bleep.name)
          .call(d3.behavior.drag()
            .origin(function(d) { return d; })
            .on("dragstart", function(d) {
              d3.event.sourceEvent.stopPropagation();
              d3.select(this).classed("dragging", true);
              $("#bleep-" + bleep._id).popover('hide');
            })
            .on("drag", function(d) {
              $("#bleep-" + bleep._id).popover('hide');

              bleep.location.x = Math.max(_bleepRadius, Math.min(_width - _bleepRadius, d3.event.x));
              bleep.location.y = Math.max(_bleepRadius, Math.min(_height - _bleepRadius, d3.event.y));

              if(!$rootScope.$$phase && !_scope.$$phase) {
                _scope.$apply();
              }

              d3.select($("#" + bleep._id)[0]).selectAll("circle")
                .attr("cx", d.x = bleep.location.x)
                .attr("cy", d.y = bleep.location.y);
            })
            .on("dragend", function(d) {
              d3.select(this).classed("dragging", false);

              pulseBlur(bleep._id);
              var _bleep = findBleep(bleep._id);
              _scope.internalControl.bleepChange(_bleep);
              addBeacons(_bleep);
            }))
          .on("mouseover", function() {
            d3.event.preventDefault();
            $("#bleep-" + bleep._id).popover('show');
          })
          .on("mouseout", function() {
            d3.event.preventDefault();
            $("#bleep-" + bleep._id).popover('hide');
          });

          _bleepSpheres[bleep._id] = {
            sphere: bleepSphere,
            rsmall: {},
            rmedium: {},
            rlarge: {}
          };

          pulseBlur(bleep._id);
      }
    }

    function findBleep(id) {
      for (var i=0; i<_scope.bleeps.length; i++ ) {
        if (_scope.bleeps[i]._id === id)
          return _scope.bleeps[i];
      }
    }

    //////////////////////////////////////////////////////////////////////
    // Beacons                                                          //
    //////////////////////////////////////////////////////////////////////

    function addBeacons(bleep, popoverDelay, supressInitialPopover) {
      var interZoneCenter = getCentroid(_bleepSpheres[bleep._id].sphere);

      if (typeof popoverDelay === 'undefined')
        popoverDelay = 0;

      console.log('Add Beacons ' + JSON.stringify(bleep));
      
      clearBeacons(bleep);

      var beaconsg = _interZone.append("g")
        .attr("id", "beacons-" + bleep._id)
        .attr("class", "beacons");

      for (var i=0; i<bleep.beacons.length; i++) {
        var beaconId = bleep.beacons[i]._id; 
        var point = addBeaconCircle(bleep, bleep.beacons[i]);

        var beacong = _svg.select("#beacon-circle-group-" + beaconId).append("g")
          .attr("transform", "translate(" + [point.x, point.y] + ")");        

        beacong.append("rect")
          .attr("id", "beacon-" + beaconId)
          .attr("class", ".beacon")
          .attr("x", 0)
          .attr("y", 0)
          .attr("width", 5)
          .attr("height", 5)
          .attr("style", "fill:orange;stroke:white;stroke-width:1;")
          .attr("data-container","body")
          .attr("data-toggle", "popover")
          .attr("data-placement", "bottom")
          .attr("data-content", bleep.beacons[i].name)
          .on("mouseover", function() {
            d3.event.preventDefault();
            $(this).popover('show');
          })
          .on("mouseout", function() {
            d3.event.preventDefault();
            $(this).popover('hide');
          });

        if (typeof supressInitialPopover === 'undefined' || 
            supressInitialPopover !== true) {
          setTimeout(function() {
            $("#beacon-" + beaconId).popover('show');
          },popoverDelay);

          var fadeOutTimer = setTimeout(function() {
            $("#beacon-" + beaconId).popover('hide');
          },3500);
        }
      }
    }

    function addBeaconCircle(bleep, beacon) {
      var interZoneCenter = getCentroid(_bleepSpheres[bleep._id].sphere);

      console.log(interZoneCenter);

      var pi = Math.PI;
      var beaconCircleRadius = getBeaconCircleOuterRadius(bleep, beacon);
          
      var arc = d3.svg.arc()
          .innerRadius(beaconCircleRadius.r - 2)
          .outerRadius(beaconCircleRadius.r)
          .startAngle((pi/180)) //converting from degs to radians
          .endAngle(7) //just radians

      var g = _interZone.select("#beacons-" + bleep._id)
        .append("g")
        .attr("id", "beacon-circle-group-" + beacon._id)
        .attr("transform", "translate(" + [interZoneCenter[0], interZoneCenter[1]] + ")");

      g.append("path")
        .attr("id", "beacon-circle-" + beacon._id)
        .attr("d", arc)
        .attr("style", "fill:#111");

      var myPath = _interZone.select("#beacon-circle-" + beacon._id).node()
      var point = myPath.getPointAtLength(getBeaconCirclePointAtLength(bleep, beacon, beaconCircleRadius.rsize));

      return point;
    }

    function getBeaconCircleOuterRadius(bleep, beacon) {
      var rssi = Math.abs(beacon.rssi);
      console.log('RSSI ' + rssi);

      if (rssi < 70) {
        saveBeaconCirclePosition(bleep, beacon, SMALL);
        return {r: 15, rsize: SMALL};
      } else if (rssi > 70 && rssi < 80) {
        saveBeaconCirclePosition(bleep, beacon, MEDIUM);
        return {r: 25, rsize: MEDIUM};
      } else {
        saveBeaconCirclePosition(bleep, beacon, LARGE);
        return {r: 30, rsize: LARGE};;
      }
    }

    function saveBeaconCirclePosition(bleep, beacon, rsize) {
      if (!(beacon._id in _bleepSpheres[bleep._id][rsize])) {
        delete _bleepSpheres[bleep._id][SMALL][beacon._id];
        delete _bleepSpheres[bleep._id][MEDIUM][beacon._id];
        delete _bleepSpheres[bleep._id][LARGE][beacon._id];
        _bleepSpheres[bleep._id][rsize][beacon._id] = undefined;
      }
    }

    function getBeaconCirclePointAtLength(bleep, beacon, rsize) {
      // TODO add time for when Beacon entered zone
      var keySize = Object.keys(_bleepSpheres[bleep._id][rsize]).length;

      if (typeof _bleepSpheres[bleep._id][rsize][beacon._id] === 'undefined')
          _bleepSpheres[bleep._id][rsize][beacon._id] = keySize===1? 0 : keySize + 5;

      console.log('BEACONS IN RSIZE ' + Object.keys(_bleepSpheres[bleep._id][rsize]).length);
      console.log('BEACON POS ' + _bleepSpheres[bleep._id][rsize][beacon._id]);

      return _bleepSpheres[bleep._id][rsize][beacon._id];
    }

    function clearBeacons(bleep) {
      closeBeaconPopovers(bleep);
      _interZone.selectAll("#beacons-" + bleep._id).remove();
    }

    function closeBeaconPopovers(bleep) {
      for (var i=0; i<bleep.beacons.length; i++) {
        $("#beacon-" + bleep.beacons[i]._id).popover('hide');
      }
    }

    //////////////////////////////////////////////////////////////////////
    // Init                                                             //
    //////////////////////////////////////////////////////////////////////

    function init(scope, el, attr) {
      _margin = {top: -5, right: -5, bottom: -5, left: -5},
        _width = scope.width - _margin.left - _margin.right,
        _height = scope.height - _margin.top - _margin.bottom;

      _zoom = d3.behavior.zoom()
          .scaleExtent([1, 10])
          .on("zoom", zoomed);

      _svg = d3.select(el[0]).append('svg')
          .attr("id", "interdrome-container")
          .attr("width", _width + _margin.left + _margin.right)
          .attr("height", _height + _margin.top + _margin.bottom)
        .append("g")
          .attr("transform", "translate(" + _margin.left + "," + _margin.right + ")")
          .call(_zoom)
          .on("mousedown", function() { 
            d3.event.preventDefault();
            d3.select(this).classed("zooming", true);
          })
          .on("mouseup", function() { 
            d3.event.preventDefault();
            d3.select(this).classed("zooming", false);
          });

      _svg.append("defs");

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
        _scope.bleeps.push(bleep);
        addBleep(bleep);
      }

      scope.internalControl.reset = function(p, bleeps) {
        d3.select(el[0]).selectAll("svg").remove();
        
        _points = p;

        init(scope, el, attr);
        redraw();

        if (typeof _scope.bleeps !== 'undefined') {
          for (var i=0; i<_scope.bleeps.length;i++) {
            addBleep(_scope.bleeps[i]);
            addBeacons(_scope.bleeps[i], 500);
          }
        }
      }

      scope.internalControl.bleepUpdate = function(bleep, beaconAddr, bleepEnter) {
        pulseBlur(bleep._id);
        if (bleepEnter)
          addBeacons(bleep);
        else
          addBeacons(bleep, 0, true);
      }

      scope.internalControl.beaconInfo = function(bleep, beacon) {
        //TODO only update single beacon (e.g. rssi)
        addBeacons(bleep, 0, true);
      };

      init(scope, el, attr);

      scope.internalControl.ready();
    }

    return {
      link: link,
      restrict: 'E',
      scope: { width: '=', height: '=', points: '=', control: '=', 
        angle: '=', pan: '=', zoom: '=', bleeps: '=' }
    };
  }]);