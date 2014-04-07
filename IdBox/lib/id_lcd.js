
var os=require('os');

module.exports = function(ip_address, port) {
	var _print, _append;
	var _set_backlight_color;
	var _colors;

	if (process.env.NODE_ENV === 'production') {
		var LCDPLATE=require('adafruit-i2c-lcd').plate;
		var lcd= new LCDPLATE('/dev/i2c-1', 0x20);
		colors = lcd.colors;

		_print = function(msg, backLightColor) {
			lcd.clear();
			lcd.message(msg);
			_set_backlight_color(backLightColor);
		}

		_set_backlight_color = function(color) {
			if (typeof color !== 'undefined') {
				lcd.backlight(color);
			}
		}

		_set_backlight_color(lcd.colors.RED);
		_print("Inter.'.Drome\nOnline");
	
		lcd.on('button_down', function (key) {
			if (key === lcd.buttons.SELECT) {
				_print('Web Admin:\n'+ ip_address + ':' + port);
			}
		});

	} else {
		_colors = {};

		_print = function(msg) {
			console.log('LCD: ' + msg);
		}

		_set_backlight_color = function(color) {
			console.log('LCD BACKLIGHT COLOR: ' + color);
		}

		console.log("Inter.'.Drome ... Online");
	}

  	return {
    	print: function(msg) {
      		_print();
    	},

		set_backlight_color: function(color) {
			_set_backlight_color(color);
		
		},

		colors: function() {
			return _colors;
		}
  	}
}