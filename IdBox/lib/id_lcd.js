
var os=require('os');

module.exports = function(ip_address, port) {
	var _lcd_print, _lcd_append;
	var _lcd_set_backlight_color;
	var _colors;

	if (process.env.NODE_ENV === 'production') {
		var LCDPLATE=require('adafruit-i2c-lcd').plate;
		var lcd= new LCDPLATE('/dev/i2c-1', 0x20);
		colors = lcd.colors;

		_lcd_print = function(msg) {
			lcd.clear();
			lcd.message(msg);
		}

		_lcd_append = function(msg) {
			lcd.message(msg);
		}

		_lcd_set_backlight_color = function(color) {
			lcd.backlight(color);
		}

		_lcd_set_backlight_color(lcd.colors.RED);
		_lcd_print("Inter.'.Drome\nOnline");
	
		lcd.on('button_down', function (key) {
		  	console.log('Buton Pressed, Key ' + key);
			if (key === lcd.buttons.SELECT) {
				_lcd_print('Web Admin:\n%s:%d', ip_address, port);
			}
		});

	} else {
		_colors = {};

		_lcd_print = function(msg) {
			console.log('LCD: ' + msg);
		}

		_lcd_append = function(msg) {
			console.log('LCD: ' + msg);
		}

		_lcd_set_backlight_color = function(color) {
			console.log('LCD BACKLIGHT COLOR: ' + color);
		}

		console.log("Inter.'.Drome ... Online");
	}

  	return {
    	lcd_print: function(msg) {
      		_lcd_print();
    	},

    	lcd_append: function(msg) {
			_lcd_append(msg);
		},

		lcd_set_backlight_color: function(color) {
			_lcd_set_backlight_color(color);
		}
  	}
}