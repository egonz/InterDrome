#include <SoftwareSerial.h>
#include <XBee.h>

#define ID_DATA_LOGGER

#if defined(ID_DATA_LOGGER)
// Data Logger
#include <Wire.h>
#include "RTClib.h"
#include <SdFat.h>
#endif

// BLE HCI
#include "typedef.h"
#include "biscuit_central.h"
#include "ble_hci.h"

#if defined(__AVR_ATmega328P__) // Arduino UNO?
#include <AltSoftSerial.h>
AltSoftSerial Serial1;
// Refer to this: http://www.pjrc.com/teensy/td_libs_AltSoftSerial.html
#endif

#define zbRxPin 2
#define zbTxPin 3

// set up a new serial port
SoftwareSerial zbSerial =  SoftwareSerial(zbRxPin, zbTxPin);

XBee xbee;

#if defined(ID_DATA_LOGGER)
RTC_DS1307 RTC;
SdFat sd;
// SD chip select pin
const uint8_t chipSelect = SS;
#endif

uint8_t priorDeviceCount = 0;
bool firstInitComplete = false;
bool discoveryActive = false;


void _start_discovery() 
{
  if (firstInitComplete && !discoveryActive) 
  {
    discoveryActive = true;
    biscuit_central_start_discovery();
  }
}

byte ble_event_available()
{
  return Serial1.available(); 
}

byte ble_event_process()
{
  uint8_t type, event_code, data_len;
  uint16_t event;
  uint8_t buf[64];

  type = Serial1.read();
  delay(35);
  event_code = Serial1.read();
  data_len = Serial1.read();
  delay(35);

  for (int i = 0; i < data_len; i++) {
    buf[i] = Serial1.read();
  }

  event = BUILD_UINT16(buf[0], buf[1]);

  switch (event)
  {
  case 0x0601: // GAP_DeviceDiscoveryDone
    {
      uint8_t numDevs = buf[3];

      if (numDevs == 0 && priorDeviceCount > 0)
      {
        Serial.println(F("Sending Device Exit."));
        delay(100);

        uint8_t payload[2];
        payload[0] = 'D';
        payload[1] = 'X';

        // Specify the address of the remote XBee (this is the SH + SL)
        XBeeAddress64 coordAddr64 = XBeeAddress64(0x00000000, 0x00000000);
        // Create a TX Request
        ZBTxRequest zbTx = ZBTxRequest(coordAddr64, payload, sizeof(payload));
        // Send your request
        xbee.send(zbTx);
      }
      else if (numDevs > 0)
      { 
        uint8_t* discoveredDeviceAddr[numDevs];

        uint8_t j = 6;
        for (int i = 0; i < numDevs; i++)  {
          memcpy(discoveredDeviceAddr[i], &buf[j], 6);
          j += 8;
        }

        uint8_t payload[2 + (6 * numDevs)];
        payload[0] = 'D';
        payload[1] = 'D';

        j = 2;   
        for (int i = 0; i < numDevs; i++)
        {
          uint8_t* addr = discoveredDeviceAddr[i];

          for (int i = 0; i < 6; i++, j++)
          {
            payload[j] = addr[i];
          }
        }

        // Specify the address of the remote XBee (this is the SH + SL)
        XBeeAddress64 coordAddr64 = XBeeAddress64(0x00000000, 0x00000000);
        // Create a TX Request
        ZBTxRequest zbTx = ZBTxRequest(coordAddr64, payload, sizeof(payload));
        // Send your request
        xbee.send(zbTx);

        Serial.print(F("Free Memory (Device Discovery):"));
        Serial.println(freeRam());
        delay(100);
      }

      priorDeviceCount = numDevs;
      discoveryActive = false;
    }
    break;

  case 0x60D: // GAP_DeviceInformation
    {
      int8_t rssi = buf[11];
      uint8_t slaveAddr[6];

      memcpy(slaveAddr, &buf[5], 6);

      char c_rssi[(8 * sizeof(int8_t)) + 1];

      uint8_t payload[11];
      payload[0] = 'D';
      payload[1] = 'I';

#if defined(ID_DATA_LOGGER)
      char logEvent[14 + (8 * sizeof(int8_t)) + 1];
      logEvent[0] = 'D';
      logEvent[1] = 'I';
#endif

      for (uint8_t i = 0, j = 2, k = 2; i < 6; i++, j++, k++)
      {
        payload[j] = slaveAddr[i];

#if defined(ID_DATA_LOGGER)
        char hx_first = (slaveAddr[i] >> 4);
        if (hx_first > 0x9) hx_first += 55; 
        else hx_first += 48;
        char hx_second = (slaveAddr[i] & 0xf);
        if (hx_second > 0x9) hx_second += 55; 
        else hx_second += 48;

        logEvent[k] = hx_first;
        logEvent[++k] = hx_second;
#endif
      }

      itoa(rssi, c_rssi, 10);

      for (int i = 0, j = 8; i < sizeof(c_rssi); i++, j++)
      {
        if (c_rssi[i] != '-')
          payload[j] = c_rssi[i];
      }

      //  //DEBUG
      //  for (int i = 0; i < sizeof(payload); i++)
      //  {
      //    Serial.print(payload[i], HEX);
      //    delay(10);
      //  }
      //
      //  //DEBUG
      //  Serial.println("");
      //  delay(10);

      // Specify the address of the remote XBee (this is the SH + SL)
      XBeeAddress64 coordAddr64 = XBeeAddress64(0x00000000, 0x00000000);
      // Create a TX Request
      ZBTxRequest zbTx = ZBTxRequest(coordAddr64, payload, sizeof(payload));
      // Send your request
      xbee.send(zbTx);

#if defined(ID_DATA_LOGGER)
      //Null out remaining logEvent payload before appending RSSI
      for (uint8_t i = 14; i < sizeof(logEvent); i++)
      {
        logEvent[i] = 0;
      }

      //Append char* RSSI
      strcat(&logEvent[14], c_rssi);

      log_to_file(logEvent);
#endif

      Serial.print(F("Free Memory (Device Info):"));
      Serial.println(freeRam());
      delay(100);
    }
    break;

  case 0x067F: // Command Recieved
    break;

  case 0x0600: //GAP_DeviceInitDone
    {
      if (!firstInitComplete) {
        firstInitComplete = true;
      }
    }
    break;

  default:
    {
      //      p("\r\n-> Not handled yet. <-\r\n");
      //      p("-Type        : 0x%02X\r\n", type);
      //      p("-EventCode   : 0x%02X\r\n", event_code);
      //      p("-Data Length : 0x%02X\r\n", data_len);
      //      p("-Event       : 0x%04X\r\n", event);
      //      p("-Status      : 0x%02X\r\n", status1);
    }
    break;
  }
}

void zero_pad(int i, ofstream* sdlog)
{
#if defined(ID_DATA_LOGGER) 
  //  if (i <= 9) {
  //    logFile.print(0, DEC);
  //  }
  //  logFile.print(i, DEC);
#endif
}

void log_to_file(const char* msg)
{
#if defined(ID_DATA_LOGGER)
  DateTime now = RTC.now();
  int month = now.month();
  int day = now.day();
  int hour = now.hour();
  int minute = now.minute();
  int second = now.second();

  // create or open a file for append
  ofstream sdlog("LOGFILE.TXT", ios::out | ios::app);

  sdlog << now.year() << F("/") << month << F("/") << day << F(" ") 
    << hour << F(":") << minute << F(":") << second << F(" #");

  sdlog << msg << endl;

  // check for errors
  if (!sdlog) sd.errorHalt("append failed");

  sdlog.close();
#endif
}

int freeRam() 
{
  extern int __heap_start, *__brkval; 
  int v; 
  return (int) &v - (__brkval == 0 ? (int) &__heap_start : (int) __brkval); 
}

void check_memory()
{
  int _freeRam = freeRam();

  //  Serial.print(F("Free Memory (check memory):"));
  //  Serial.println(_freeRam);

  if (_freeRam < 100) 
  {
    Serial.println(F("Free Memory < 100!"));
    delay(10);
  } 
  else if (_freeRam < 50) 
  {
    Serial.println(F("Free Memory < 50!!"));
    delay(10);
  }  
}

void setup()
{ 
#if defined(__AVR_ATmega328P__)
  Serial1.begin(57600);
  Serial.begin(57600);

  ble_hci_init(&Serial1);
#else
  Serial1.begin(57600);
  Serial.begin(115200);
  while (!Serial1);

  ble_hci_init();
#endif

  xbee = XBee();  
  zbSerial.begin(9600);
  // Tell XBee to use Hardware Serial. It's also possible to use SoftwareSerial
  xbee.setSerial(zbSerial);

#if defined(ID_DATA_LOGGER)
  Wire.begin();
  RTC.begin();

  if (! RTC.isrunning()) {
    // following line sets the RTC to the date & time this sketch was compiled
    // uncomment it & upload to set the time, date and start run the RTC!
    RTC.adjust(DateTime(__DATE__, __TIME__));
  }

  // initialize the SD card at SPI_HALF_SPEED to avoid bus errors with
  // breadboards.  use SPI_FULL_SPEED for better performance.
  if (!sd.begin(chipSelect, SPI_HALF_SPEED)) sd.initErrorHalt();
#endif

  biscuit_central_init();
}

void loop()
{ 
  check_memory();

  delay(1000);

  _start_discovery();

  while (ble_event_available())
    ble_event_process();
}




