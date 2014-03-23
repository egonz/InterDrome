#include <stdlib.h>
#include <string.h>

#include <SoftwareSerial.h>
#include <XBee.h>

#define ID_DATA_LOGGER

#if defined(ID_DATA_LOGGER)
// Data Logger
#include <Wire.h>
#include "RTClib.h"
#include <SPI.h>   //Needed for IDE version 1.5+
#include <SD.h>
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

const int MAX_DATA_LEN = 10;
const int DATA_LOGGER_CHIP_SELECT = 10;

// set up a new serial port
SoftwareSerial zbSerial =  SoftwareSerial(zbRxPin, zbTxPin);

XBee xbee;

#if defined(ID_DATA_LOGGER)
RTC_DS1307 RTC;
File logFile;
bool sdReady = false;
#endif

int priorDeviceCount = 0;
int processCount = 0;
bool firstInitComplete = false;
bool discoveryActive = false;

// Specify the address of the remote XBee (this is the SH + SL)
XBeeAddress64 coordAddr64 = XBeeAddress64(0x00000000, 0x00000000);


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

void on_device_info(uint8_t* address, int8_t rssi)
{
  uint8_t payload[11];
  payload[0] = 'D';
  payload[1] = 'I';
  
#if defined(ID_DATA_LOGGER)
  char logEvent[14 + (8 * sizeof(int8_t)) + 1];
  char c_rssi[(8 * sizeof(int8_t)) + 1];
  logEvent[0] = 'D';
  logEvent[1] = 'I';
#endif
  
  for (uint8_t i = 0, j = 2, k = 2; i < 6; i++, j++, k++)
  {
    payload[j] = address[i];
    
#if defined(ID_DATA_LOGGER)
    char hx_first = (address[i] >> 4);
    if (hx_first > 0x9) hx_first += 55; else hx_first += 48;
    char hx_second = (address[i] & 0xf);
    if (hx_second > 0x9) hx_second += 55; else hx_second += 48;
    
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

  // Create a TX Request
  ZBTxRequest zbTx = ZBTxRequest(coordAddr64, payload, sizeof(payload));
  // Send your request
  xbee.send(zbTx);
  
#if defined(ID_DATA_LOGGER)  
  //Null out remaining logEvent payload before appending RSSI
  uint8_t logEventLen = 14 + (8 * sizeof(int8_t)) + 1;
  for (uint8_t i = 14; i < logEventLen; i++)
  {
    logEvent[i] = 0;
  }
  
  //Append char* RSSI
  strcat(&logEvent[14], c_rssi);
  
//  Serial.println(logEvent);
//  delay(10);
  
//  log_to_file(logEvent);
#endif
}

void on_device_discovery_complete_event(uint8_t* discoveredDeviceAddr[], uint8_t len)
{
  uint8_t payload[2 + (6 * len)];
  payload[0] = 'D';
  payload[1] = 'D';
 
  int j = 2;   
  for (int i = 0; i < len; i++)
  {
    uint8_t* addr = discoveredDeviceAddr[i];
   
    for (int i = 0; i < 6; i++, j++)
    {
      payload[j] = addr[i];
    }
  }
  
//  int endidx = sizeof(payload);
//  for (int i = 0; i < endidx; i++)
//  {
//    Serial.print(payload[i], HEX);
//    delay(10);
//  }
//  Serial.println("");
//  delay(10);
  
  // Create a TX Request
  ZBTxRequest zbTx = ZBTxRequest(coordAddr64, payload, sizeof(payload));
  // Send your request
  xbee.send(zbTx);
  
  //TODO Report Discovered Devices
}

void on_device_exit()
{
  //TODO Report No Devices
}

byte ble_event_process()
{
  uint8_t type, event_code, data_len, status1;
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
  status1 = buf[2];

  switch (event)
  {
  case 0x0601: // GAP_DeviceDiscoveryDone
    {
      uint8_t numDevs = buf[3];
      
      if (numDevs == 0 && priorDeviceCount == 0) {
        delay(35);
      } 
      else if (numDevs == 0 && priorDeviceCount > 0)
      {
        on_device_exit();
      }
      else 
      { 
        uint8_t* discoveredDeviceAddr[numDevs];

        uint8_t j = 6;
        for (int i = 0; i < numDevs; i++)  {
          memcpy(discoveredDeviceAddr[i], &buf[j], 6);
          j += 8;
        }

        on_device_discovery_complete_event(discoveredDeviceAddr, numDevs);
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
      
      on_device_info(slaveAddr, rssi);
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

void zero_pad(int i)
{
#if defined(ID_DATA_LOGGER) 
  if (i <= 9) {
    logFile.print(0, DEC);
  }
  logFile.print(i, DEC);
#endif
}

void log_to_file(char* dataString)
{
#if defined(ID_DATA_LOGGER)
  if (!sdReady || logFile)
    return;
 
  logFile = SD.open("DATALOG.txt", FILE_WRITE);

  if (logFile) 
  {
//    DateTime now = RTC.now();
//  
//    zero_pad(now.year());
//    zero_pad(now.month());
//    zero_pad(now.day());
//    zero_pad(now.hour());
//    zero_pad(now.minute());
//    zero_pad(now.second());
//    logFile.print(",");
//
//    logFile.println(dataString);
    logFile.close();
  } 
#endif
}

void setup()
{ 
#if defined(ID_DATA_LOGGER)
  pinMode(DATA_LOGGER_CHIP_SELECT, OUTPUT);

  Wire.begin();
  RTC.begin();
#endif

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
  if (! RTC.isrunning()) {
    // following line sets the RTC to the date & time this sketch was compiled
    // uncomment it & upload to set the time, date and start run the RTC!
    RTC.adjust(DateTime(__DATE__, __TIME__));
  }

  // see if the card is present and can be initialized:
  if (!SD.begin(DATA_LOGGER_CHIP_SELECT)) {
    sdReady = false;
  }
  else
  {
    sdReady = true;
  }
#endif

  biscuit_central_init();
}

void loop()
{   
  _start_discovery();

  if (ble_event_available())
    ble_event_process();
}



