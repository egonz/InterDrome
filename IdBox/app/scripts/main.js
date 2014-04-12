var stage = new Kinetic.Stage({
  container: 'container',
  width: 640,
  height: 480
});

var bleep_counter = 0;


function add_interzone() {
  var interZoneLayer = new Kinetic.Layer();
  var interZoneImageObj = new Image();
  interZoneImageObj.onload = function() {
    var interZone = new Kinetic.Image({
      x: 0,
      y: 0,
      image: interZoneImageObj,
      width: 640,
      height: 480
    });

    // add the shape to the layer
    interZoneLayer.add(interZone);

    // add the layer to the stage
    stage.add(interZoneLayer);
  };
  interZoneImageObj.src = 'images/house.png';
}

function add_bleep() {
  var bleepLayer = new Kinetic.Layer();
  var bleepImageObj = new Image();
  bleepImageObj.onload = function() {
    var bleep = new Kinetic.Image({
      x: 0,
      y: 0,
      image: bleepImageObj,
      width: 30,
      height: 38,
      draggable: true
    });

    // add the shape to the layer
    bleepLayer.add(bleep);

    // add the layer to the stage
    stage.add(bleepLayer);

    bleep_counter += 1;
    var bleep_id = bleep_counter;

    bleep.on('dragend', function() {
      console.log('dragend. bleep id ' + bleep_id + '. New x:' + 
        bleep.x() + ', new y:' + bleep.y());
    });
  };
  bleepImageObj.src = 'images/tetrahedron.png';
}

add_interzone();

$("#add-bleep").click(function() {
  add_bleep();
})
