#include <StandardCplusplus.h>
#include <string>
#include <vector>
#include <iterator>
#include <stdarg.h>
#include "typedef.h"
#include "biscuit_central.h"
#include "ble_hci.h"

using namespace std;

#if defined(__AVR_ATmega328P__) // Arduino UNO?
#include <AltSoftSerial.h>
AltSoftSerial Serial1;
// Refer to this: http://www.pjrc.com/teensy/td_libs_AltSoftSerial.html
#endif

uint8_t found_address[6];
bool firstInitComplete = false;
bool discoveryActive = false;
vector<uint8_t> _bleeps;

void p(char *fmt, ... )
{
  char tmp[128]; // resulting string limited to 128 chars
  va_list args;
  va_start (args, fmt );
  vsnprintf(tmp, 128, fmt, args);
  va_end (args);
  Serial.print(tmp);
}

void ble_event_poll()
{
}

void _startDiscovery() 
{
  if (firstInitComplete && !discoveryActive) 
  {
    discoveryActive = true;
    p(" Start discovery...........................................\r\n");
    biscuit_central_start_discovery();
  }
}

byte ble_event_available()
{
  return Serial1.available(); 
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

  for (int i = 0; i < data_len; i++)
    buf[i] = Serial1.read();

  event = BUILD_UINT16(buf[0], buf[1]);
  status1 = buf[2];

  switch (event)
  {
  case 0x0601: // GAP_DeviceDiscoveryDone
    {
      p("-> GAP_DeviceDiscoveryDone <-\r\n");

      uint8_t num_devs = buf[3];

      p("##### NUMBER OF DEVICES     : ");
      Serial.print(num_devs,DEC);
      p("\r\n");

      discoveryActive = false;
    }
    break;

  case 0x051B: // ATT_HandleValueNotification
    {
      p("ATT_HandleValueNotification\r\n");

      uint8_t data[21] = {
        0      };
      uint8_t len = data_len - 8;

      if (len > 20)
        len = 20;

      memcpy(data, &buf[8], len);

      p(" -------------> Received from Biscuit peripheral: %s\r\n", data);
    }
    break;

  case 0x60D: // GAP_DeviceInformation
    {
      p(" -> GAP_DeviceInformation <-\r\n");

      uint8_t eventType = buf[3];
      uint8_t addrType = buf[4];

      p(" Event Type  : ");
      Serial.print(eventType, DEC);
      p("\r\n");

      p(" Addr Type   : ");
      Serial.print(addrType, DEC);
      p("\r\n");

      memcpy(found_address, &buf[5], 6); // store 1 device address only in this demo

      p(" Addr        : 0x");

      for (int i = 0; i < 6; i++)  {
        p("%02X", found_address[i]);
        if ((i + 1) < 6) {
          p(":");
        }      
      }

      p("\r\n");
      
      biscuit_central_connect(found_address);

      int8_t rssi = buf[11];
      uint8_t dataLen = buf[12];

      p(" RSSI        : ");
      Serial.print(rssi);
      p("\r\n");

      p(" Data Len    : ");
      Serial.print(dataLen, DEC);
      p("\r\n");

      uint8_t * dataField = (uint8_t*)  calloc(dataLen, sizeof(uint8_t));
      memcpy(dataField, &buf[13], dataLen); // store 1 device address only in this demo
      p(" Data Field  : ");
      for (int i = 0; i < dataLen; i++)  {
        if (dataField[i] == 0 || dataField[i] == 255)
          break;
        else if (dataField[i] > 21 && dataField[i] < 122)
          p("%c", dataField[i]);   
      }
      p("\r\n");
      free(dataField);
    }
    break;

  case 0x067F: // Command Recieved
    {
      p(" -> Command Received.\r\n");
    }
    break;

  case 0x0600: //GAP_DeviceInitDone
    {
      p(" -> GAP_DeviceInitDone.\r\n");
      if (!firstInitComplete) {
        firstInitComplete = true;
//        biscuit_central_enable_notification();
      }
    }
    break;

  default:
    {
      //      p(" -> Not handled yet. <-\r\n");
      //      p("-Type        : 0x%02X\r\n", type);
      //      p("-EventCode   : 0x%02X\r\n", event_code);
      //      p("-Data Length : 0x%02X\r\n", data_len);
      //      p("-Event       : 0x%04X\r\n", event);
      //      p("-Status      : 0x%02X\r\n", status1);
    }
    break;
  }

  delay(35);
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

  biscuit_central_init();
}

void loop()
{
  _startDiscovery();

  while (ble_event_available())
    ble_event_process();

  //        biscuit_central_write_bytes((uint8 *)"I love BLE!\r\n", 13);
}


