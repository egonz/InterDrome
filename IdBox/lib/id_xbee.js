var util = require('util'),
    fs = require('fs'),
    config = require('./config/config'),
    SerialPort = require('serialport').SerialPort,
    xbee_api = require('xbee-api'),
    mongoose = require('mongoose'),
    Beacon = mongoose.model('Beacon'),
    Bleep = mongoose.model('Bleep'),
    BleepEvent = mongoose.model('BleepEvent'),
    DateUtil = require('./date_util');

module.exports = function(lcd, socket, bleepActions) {
 
  lcd.add_button_listener(function(key) {
    if (key === lcd.buttons.LEFT) {
      console.log("LEFT Pressed");
    } else if (key === lcd.buttons.RIGHT) {
      console.log("RIGHT Pressed");
    }
  });


  /************************************************************
   * ZigBee / XBee Inter.'.Drome                              *
   ************************************************************/

  var C = xbee_api.constants;
  var EXIT = 'EXIT';
  var ENTER = 'ENTER';

  var xbeeAPI = new xbee_api.XBeeAPI({
    api_mode: 1
  });

  if (fs.existsSync(config.xbee.serial.port)) {
      var serialport = new SerialPort(config.xbee.serial.port, {
        baudrate: config.xbee.serial.baud,
        parser: xbeeAPI.rawParser()
      });
  } else {
    console.log("Serial port %s doesn't exist!", config.xbee.serial.port);
  }

  function onDeviceInfo(beacon, bleep) {
    bleepActions.enterAction(beacon, bleep, [bleepActions.ACTIONS.TURN_ON, bleepActions.ACTIONS.TURN_OFF]);
    socket.emit('beacon-info', {bleep:bleep, beacon:beacon});
  }

  function allDeviceExit(bleep) {
    bleepActions.exitAction(undefined, bleep, [bleepActions.ACTIONS.TURN_ON, bleepActions.ACTIONS.TURN_OFF]);
  }

  function onDeviceExit(id, beacon) {
    Bleep.findById(id)
      .populate('beacons')
      .lean()
      .exec(function (err, bleep) {

      var beaconAddr;

      if (typeof beacon !== 'undefined')
        beaconAddr = beacon.address;

      console.log('On Device Exit: Beacon Address: ' + beaconAddr);

      socket.emit('bleep-exit', {bleep: bleep, beaconAddr: beaconAddr});
      
      lcd.print('Device Exit\n' + new Date().format("hh:mm:ss"), lcd.colors.GREEN);
      
      bleepActions.exitAction(beacon, bleep, [bleepActions.ACTIONS.NOTIFICATION]);
    });
  }

  function onDeviceEnter(id, beacon) {
    Bleep.findById(id)
      .populate('beacons') // only return the Persons name
      .exec(function (err, bleep) {
        socket.emit('bleep-enter', {bleep: bleep, beaconAddr: beacon.address});
      
        lcd.print('Device Enter\n' + new Date().format("hh:mm:ss"), lcd.colors.GREEN);

        bleepActions.enterAction(beacon, bleep, [bleepActions.ACTIONS.NOTIFICATION]);
      });
  }

  function saveBleepEvent(event, bleep, beaconAddr) {
    Beacon.findOne({ address: beaconAddr }, function (err, beacon) {
      if (err) {
        console.log('Error finding beacon addr ' + beaconAddr);
      } else if (beacon) {
        
        var bleepEvent = new BleepEvent();
        bleepEvent.event = event;
        bleepEvent.bleep = bleep._id;
        bleepEvent.beacon = beacon._id;
        bleepEvent.created = Date.now();

        bleepEvent.save(function (err, beacon, numberAffected) {
          if (err || numberAffected <= 0) {
            console.log("Error saving beacon.");
          }
        });
      } else {
        console.log('saveBleepEvent No beacon found for address ' + beaconAddr);
      }
    });
  }

  function findBeaconsAndSaveBleep(bleep, addrs, index) {
    if (typeof index === 'undefined' || !index)
      index = 0;

    if (addrs && index < addrs.length) {
      console.log('Finding beacon for addr ' + addrs[index]);
      Beacon.findOne({ address: addrs[index] }, function (err, beacon) {
          if (err) {
            console.log('Error finding beacon addr ' + addrs[index]);
          } else if (beacon) {
            bleep.beacons.push(beacon._id);
            findBeaconsAndSaveBleep(bleep, addrs, ++index);
          } else {
            console.log('findBeaconsAndSaveBleep No beacon found for address ' + addrs[index]);
          }
      });
    } else {
      // save bleep
      console.log('Saving Bleep');
      bleep.save(function (err, bleep, numberAffected) {
        if (err || numberAffected <= 0) {
          console.log("Error saving bleep.");
        }
      });
    }
  }

  function saveUpdatedBleep(bleep, exits, enters) {
    bleep.updated = Date.now();

    console.log('Found exits ' + exits.length);
    console.log('Found enters ' + enters.length);
            
    bleep.save(function (err, bleep, numberAffected) {
      if (err || numberAffected <= 0) {
        console.log("Error updating bleep.");
      }

      enters.forEach(function(beacon) {
        onDeviceEnter(bleep._id, beacon);
      });

      exits.forEach(function(beacon) {
        onDeviceExit(bleep._id, beacon);
      });
    });
  }

  function clearBleepForBeacon(beaconAddr) {
    Beacon.findOneAndUpdate({address: beaconAddr}, 
        {bleep: null}, {new: false}, function(err, beacon) {
      if (err) {
        console.log('Error updating Beacon with a null BLEEP.');
      }
    });
  }

  function checkForExits(bleep) {
    var bleepBeacons = bleep.beacons;

    //Check for beacon exits
    for (var i = 0; i < bleepBeacons.length; i++) {
      console.log('Creating Beacon exit for ' + bleepBeacons[i].address);
      saveBleepEvent(EXIT, bleep, bleepBeacons[i].address);
      clearBleepForBeacon(bleepBeacons[i].address);
    }
  }

  function checkForEnters(bleep, beaconAddrs, exits, enters, index) {
    if (typeof enters === 'undefined') {
      enters = [];
      index = 0;
    }

    if (index < beaconAddrs.length) {
      //Check for beacon enters
      var beaconAlreadyInZone = false;
      var beacons = bleep.beacons;

      for (var i = 0; i < beacons.length; i++) {
        if (beacons[i].address === beaconAddrs[index]) {
          beaconAlreadyInZone = true;
        }
      }

      if (!beaconAlreadyInZone) {
        Beacon.findOne({address: beaconAddrs[index]}, function(err, beacon) {
          if (!err && beacon) {
            enters.push(beacon);
            bleep.beacons.push(beacon._id);
            //Create Enter event
            saveBleepEvent(ENTER, bleep, beacon.address);

            beacon.bleepEnter = Date.now();
            beacon.created = Date.now();
            beacon.save(function (err, beacon, numberAffected) {
              if (err || numberAffected <= 0) {
                console.log("Error saving beacon.");
              }
            })
          }
          checkForEnters(bleep, beaconAddrs, exits, enters, ++index);
        });
      } else {
        checkForEnters(bleep, beaconAddrs, exits, enters, ++index);
      }
    } else {
      saveUpdatedBleep(bleep, exits, enters);
    }
      
  }

  function updateBleepBeacons(bleep, beaconAddrs, exits, enters) {
    var i;

    if (typeof exits === 'undefined') {
      exits = [];
      var bleepBeacons = bleep.beacons;

      //Check for beacon exits
      for (i = 0; i < bleepBeacons.length; i++) {
        if (beaconAddrs.indexOf(bleepBeacons[i].address) <= -1) {
          exits.push(bleepBeacons[i]);
          //Create exit event
          saveBleepEvent(EXIT, bleep, bleepBeacons[i].address);
          clearBleepForBeacon(bleepBeacons[i].address);

          //BLEEP EXIT
        }
      }
      for (i = 0; i < exits.length; i++) {
        bleep.beacons.splice(bleep.beacons.indexOf(exits[i]), 1);
      }
      updateBleepBeacons(bleep, beaconAddrs, exits);
    
    } else if (typeof enters === 'undefined') {
      checkForEnters(bleep, beaconAddrs, exits); 
    }
  }

  function saveBleep(bleepAddr, beaconAddrs) {
    Bleep.findOne({ address: bleepAddr })
      .populate('beacons') // only return the Persons name
      .exec(function (err, bleep) {
      
        if (!err) {
          if (bleep) {
            updateBleepBeacons(bleep, beaconAddrs);
          } else {
            console.log('New Bleep');

            bleep = new Bleep();
            bleep.address = bleepAddr;
            bleep.created = Date.now();
            bleep.beacons = [];

            findBeaconsAndSaveBleep(bleep, beaconAddrs);
          }
        } else {
          console.log("Error looking up bleep for address: " + bleepAddr + "; " + err);
        }
    });
  }

  function saveBeacon(addr, addrBuf, rssi, bleepAddr) {
    Beacon.findOne({ address: addr }, function (err, beacon) {
      if (!err) {
        if (beacon) {
          beacon.rssi = rssi;

          Bleep.findOne({ address: bleepAddr }) 
            .populate('beacons') 
            .exec(function (err, bleep) {
            
            beacon.updated = Date.now();

            if (!err && bleep)
              beacon.bleep = bleep._id;

            beacon.save(function (err, beacon, numberAffected) {
              if (err || numberAffected <= 0) {
                console.log("Error saving beacon.");
              }
              onDeviceInfo(beacon, bleep);
            });
          });
        } else {
          console.log('Saving new beacon ' + addr);
          beacon = new Beacon();
          beacon.address = addr;
          beacon.addrBuf = addrBuf;
          beacon.rssi = rssi;

          Bleep.findOne({ address: bleepAddr }) 
            .populate('beacons') 
            .exec(function (err, bleep) {

            if (!err && bleep) {
              console.log('Adding reference to Bleep id ' + bleep._id);
              beacon.bleep = bleep._id;
            }

            beacon.created = Date.now();

            beacon.save(function (err, beacon, numberAffected) {
              if (err || numberAffected <= 0) {
                console.log("Error saving beacon. " + err);
              }
              onDeviceInfo(beacon, bleep);
            });
          });
        }
      } else {
        console.log("Error looking up beacon for address: " + addr + "; " + err);
      }
    });
  }

  function processDeviceInfoEvent(bleepAddr, data) {
    try {
      process.stdout.write('Beacon Address: ');

      var addr = "";
      var addrBuf = [];
      var rssi;
      var dataLength = data.length;
      var beaconIdx = 0;
      
      for (var i = 2; i < 8; i++) {
        addr += data[i].toString(16).toUpperCase();
        addrBuf.push(data[i]);
      }

      console.log(addr);

      if (data[9] && data[10]) {
        rssi = Number(String.fromCharCode(data[9]) + String.fromCharCode(data[10])) * -1;
        console.log('Beacon RSSI: ' + rssi);
      } else {
        console.log('No RSSI data, received:', data[8], data[9], data[10]);
      }

      saveBeacon(addr, addrBuf, rssi, bleepAddr);
    } catch (e) {
      console.log('Error processing Device Info event');
    }
  }

  function processDeviceDiscovery(bleepAddr, data) {
    try {
      var beaconAddrs = [];
      var beaconAddr = "";
      var dataLength = data.length;
      var beaconIdx = 0;

      for (var i = 2; i < dataLength; i++) {
        beaconAddr += data[i].toString(16).toUpperCase();

        if ((i + 1 <= dataLength) && beaconIdx++ === 5) {
          beaconAddrs.push(beaconAddr);
          beaconAddr = "";
          beaconIdx = 0;
        }
      }

      saveBleep(bleepAddr, beaconAddrs);
    } catch (e) {
      console.log('Error processing Device Discovery event');
    }
  }

  function processDeviceExit(bleepAddr) {
    try {
      Bleep.findOne({ address: bleepAddr })
      .populate('beacons') // only return the Persons name
      .exec(function (err, bleep) {
        if (err) {
          console.log('Error looking up bleep');
        } else if (bleep) {
          checkForExits(bleep);

          allDeviceExit(bleep);

          bleep.beacons = [];
          bleep.updated = Date.now();
          bleep.save(function (err, bleep, numberAffected) {
            if (err || numberAffected <= 0) {
              console.log("Error updating bleep.");
            }

            onDeviceExit(bleep);
          });
        } else {
          console.log('Bleep not found!');
        }
      });
    } catch (e) {
      console.log('Error processing Device Exit event');
    }
  }

  if (typeof serialport !== 'undefined') {
      serialport.on("open", function() {
        // var frame_obj = { // AT Request to be sent to 
        //   type: C.FRAME_TYPE.AT_COMMAND,
        //   command: "NI",
        //   commandParameter: [],
        // };

        // serialport.write(xbeeAPI.buildFrame(frame_obj));
      });
  }

  // All frames parsed by the XBee will be emitted here
  xbeeAPI.on("frame_object", function(frame) {
    try {
      var type = frame.type;
      var bleepAddr = frame.remote64;
      var data = frame.data;

      var eventType = String.fromCharCode(data[0]) + String.fromCharCode(data[1]);

      console.log('---');

      console.log(new Date().toString());
      console.log('BLEEP Address:', bleepAddr);
      console.log('Event:', eventType);

      if (eventType === 'DI') {
        processDeviceInfoEvent(bleepAddr, data);
      } else if (eventType === 'DD') {
        processDeviceDiscovery(bleepAddr, data);
      } else if (eventType === 'DX') {
        processDeviceExit(bleepAddr);
      }
    } catch (e) {
      console.log('Error processing XBee frame_object.');
    }    
  });

  return {

  }
}