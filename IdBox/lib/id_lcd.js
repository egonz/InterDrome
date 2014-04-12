
var os=require('os');

module.exports = function(ip_address, port) {
	var _print, _append;
	var _set_backlight_color;
	var _button_listeners = [];

	if (process.env.NODE_ENV === 'production') {
		var LCDPLATE=require('adafruit-i2c-lcd').plate;
		var lcd= new LCDPLATE('/dev/i2c-1', 0x20);

		_print = function(msg, color) {
			lcd.clear();
			lcd.message(msg);
			_set_backlight_color(color);
		}

		_set_backlight_color = function(color) {
			if (typeof color !== 'undefined') {
				lcd.backlight(color);
			}
		}

		_turn_off = function() {
			lcd.backlight(lcd.colors.OFF);
		}

		_set_backlight_color(lcd.colors.RED);
		_print("Inter.'.Drome\nOnline");
	
		lcd.on('button_down', function (key) {
			if (key === lcd.buttons.SELECT) {
				_print(ip_address + ':\n' + port, lcd.colors.YELLOW);
			}

			_button_listeners.forEach(function(element, index, array) {
				element(key);
			});
		});

	} else {
		_print = function(msg) {
			console.log('LCD: ' + msg);
		}

		_set_backlight_color = function(color) {
			console.log('LCD BACKLIGHT COLOR: ' + color);
		}

		_turn_off = function() {
			console.log('Turning off lcd');
		}

		console.log("Inter.'.Drome ... Online");
	}

	function _shutdown() {
		child = exec('sudo shutdown -t 0 now',
		  function (error, stdout, stderr) {
		    console.log('stdout: ' + stdout);
		    console.log('stderr: ' + stderr);
		    if (error !== null) {
		      console.log('exec error: ' + error);
		    }
		});
	}

  	return {
    	print: function(msg, color) {
      		_print(msg, color);
    	},

		set_backlight_color: function(color) {
			_set_backlight_color(color);
		
		},

		add_button_listener: function(callback) {
			_button_listeners.push(callback);
		},

		turn_off: function() {
			_turn_off();
		},

		colors: {
	     	OFF: 0x00,
			RED: 0x01,
			GREEN: 0x02,
	      	BLUE: 0x04,
	      	YELLOW: 0x03,
	      	TEAL: 0x06,
	      	VIOLET: 0x05,
	      	WHITE: 0x07,
	      	ON: 0x07
	    }
  	}
}