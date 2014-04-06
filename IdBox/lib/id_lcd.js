var LCDPLATE=require('adafruit-i2c-lcd').plate;
var lcd= new LCDPLATE('/dev/i2c-1', 0x20);

lcd.backlight = lcd.colors.red;
lcd.message('Hello World!');