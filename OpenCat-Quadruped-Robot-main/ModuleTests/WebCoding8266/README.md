# WebCoding8266 - ESP8266 WebSocket Server for Petoi Robot

This is a comprehensive WebSocket server program for ESP8266 that enables web clients to control Petoi robots through real-time WebSocket connections. Based on OpenCatEsp32 architecture with enhanced timeout management and command processing.

## Features

### Core Communication
- **WebSocket server** on port 81 for real-time bidirectional communication
- **HTTP server** on port 80 for status information and monitoring
- **High-speed serial communication** with Petoi robot (115200 baud, 40ms timeout)
- **Intelligent command forwarding** from WebSocket to serial with response handling
- **Robot response forwarding** from serial back to WebSocket clients

### Network Management
- **WiFiManager integration** for easy WiFi configuration through captive portal
- **Dynamic SSID generation** with random 4-digit number (Petoi-AP####)
- **EEPROM storage** for persistent SSID and WiFi settings
- **Automatic WiFi reconnection** with saved credentials
- **Serial commands** for network configuration management

### Advanced Command Processing
- **Base64 decoding** for binary commands (music, complex data)
- **Intelligent timeout system** based on command type (5-30 seconds)
- **Smart terminator handling** ('~' for uppercase, '\n' for lowercase commands)
- **Task completion tracking** with proper client acknowledgment
- **Heartbeat mechanism** for connection health monitoring
- **JSON command parsing** with multiple format support

## Hardware Requirements

- ESP8266 module (ESP-WROOM-02D recommended)
- USB-to-Serial converter for programming
- Petoi robot (Bittle, Nybble, etc.)

## Software Requirements

### Required Libraries

1. **ESP8266WiFi** - Built-in with ESP8266 board package
2. **ESP8266WebServer** - Built-in with ESP8266 board package
3. **WiFiManager** - Install via Library Manager
   - Search for "WiFiManager" by tzapu
   - Version 0.16.0 or later recommended
   - URL: https://github.com/tzapu/WiFiManager
4. **WebSockets** - Install via Library Manager
   - Search for "WebSockets" by Markus Sattler
   - This library includes both WebSocketsServer and WebSocketsClient
   - Version 2.6.1 or later recommended
5. **ArduinoJson** - Install via Library Manager
   - Search for "ArduinoJson" by Benoit Blanchon
   - Version 7.x supported (uses JsonDocument without size parameter)
6. **EEPROM** - Built-in with ESP8266 board package

**Note:** If you have both "WebSockets" and "WebSocketsServer" libraries installed, the code will work with either one as they are essentially the same library. The "WebSockets" library is the main one and includes both server and client functionality.

### Board Configuration

- Board: Generic ESP8266 Module
- Upload Speed: 921600
- CPU Frequency: 80MHz
- Flash Size: 4MB (FS:2MB / OTA:1019KB)
- Flash Mode: DQOUT

## Installation

1. Install the required libraries using Arduino IDE Library Manager
2. Connect ESP8266 to your computer via USB
3. Select the correct board and port in Arduino IDE
4. Upload the `WebCoding8266.ino` file
5. Open Serial Monitor (115200 baud) to see status messages

### Resolving Library Conflicts

If you see the warning "Multiple libraries were found for WebSocketsServer.h", you can:

1. **Option 1 (Recommended)**: Keep only the "WebSockets" library
   - Go to `~/Documents/Arduino/libraries/`
   - Delete the "WebSocketsServer" folder
   - Restart Arduino IDE

2. **Option 2**: Let Arduino IDE choose automatically
   - The code will work with either library
   - Arduino IDE will use the first one it finds

### Compilation Notes

- **ArduinoJson Version**: The code uses `JsonDocument` (version 7.x) without size parameter
- **Function Declarations**: All functions are properly declared at the top of the file
- **Library Dependencies**: The code includes all necessary function declarations to avoid compilation errors
- **ESP8266 Compatibility**: Tested with ESP8266 Arduino Core version 3.1.2

## Usage

### Initial Setup

1. After uploading, the ESP8266 will generate a unique SSID with format: `Petoi-AP[XXXX]` where XXXX is a random 4-digit number
2. The SSID and random number are saved to EEPROM and will persist across reboots
3. If no saved WiFi credentials exist, WiFiManager will create a configuration portal with the generated SSID
4. Connect to the ESP8266's WiFi network from your phone/computer
5. A captive portal should open automatically, or navigate to **http://192.168.4.1**
6. Select "Configure WiFi" and choose your home WiFi network
7. Enter your WiFi password and click "Save"
8. The device will restart and connect to your WiFi network
9. Note the IP address displayed in the Serial Monitor

### SSID Management

#### Automatic SSID Generation
- On first boot, the system generates a random 4-digit number
- SSID format: `Petoi-AP[XXXX]` (e.g., `Petoi-AP1234`)
- The random number is saved to EEPROM and reused on subsequent boots

#### Serial Commands for Management

**Change SSID Name:**
- **Format:** `n[newName]`
- **Examples:** `nLittleDog`, `nMyRobot`, `nBittle`
- **Result:** SSID becomes `[newName]-AP` (removes random number)

**Clear WiFi Settings:**
- **Command:** `w!`
- **Result:** Clears saved WiFi credentials, device will show configuration portal on next restart

**Reset WiFi Settings:**
- **Command:** `r`
- **Result:** Clears saved WiFi credentials, device will show configuration portal on next restart

**Clear All EEPROM Data:**
- **Command:** `E`
- **Result:** Clears all stored data including SSID and WiFi settings

**Usage:**
1. Open Serial Monitor (115200 baud)
2. Send any of the above commands
3. Restart the device for changes to take effect

### WebSocket Connection

Connect to the WebSocket server at: `ws://[ESP8266_IP]:81`

### Command Format

#### JSON Format with Commands Array (Task Format)
```json
{
  "type": "command",
  "taskId": "1754565109364",
  "commands": ["?"],
  "timestamp": 1754565109364
}
```
Result: Sends "?" to robot

#### JSON Format with Token and Command
```json
{
  "token": "k",
  "command": "sit"
}
```
Result: Sends "ksit" to robot

#### JSON Format with Command Only
```json
{
  "command": "khi"
}
```
Result: Sends "khi" to robot

#### Plain Text Format
```
ksit
```
Result: Sends "ksit" to robot

#### Base64 Encoded Format
```
b64:QgoBDgERAX4=
```
Result: Decodes to binary music command `B 10 1 14 1 17 1~` and sends raw bytes to robot

### Example Commands

#### Basic Commands
- `d` - Rest position (sent as `d\n`)
- `khi` - Greetings (sent as `khi\n`)
- `kpu` - Push-ups (sent as `kpu\n`)
- `kwkF` - Walk forward (sent as `kwkF\n`)
- `ktrF` - Trot forward (sent as `ktrF\n`)
- `ksit` - Sit (sent as `ksit\n`)
- `g` - Turn on gyro (sent as `g\n`)

#### Advanced Commands  
- `G` - Turn off gyro (sent as `G~`)
- `I` - Indexed simultaneous binary movement (sent as `I~`)
- `i` - Indexed simultaneous movement (sent as `i0 90\n`)
- `L` - Control all joints binary (sent as `L~`)
- `m` - Indexed sequential movement (sent as `m1 45 0 45\n`)
- `j` - Joint angle query (sent as `j\n`)
- `gu` - Gyro reading (sent as `gu\n`)

#### Binary/Music Commands
- `b64:QgoBDgERAX4=` - Base64 encoded music (decodes to `B 10 1 14 1 17 1~`)
- `B` - Binary beep command (sent as `B~`)
- `b` - ASCII beep command (sent as `b12 8 14 8\n`)

### WebSocket Events

#### Connection Events
- `WStype_CONNECTED` - Client connected, sends welcome message
- `WStype_DISCONNECTED` - Client disconnected

#### Message Events
- `WStype_TEXT` - Command received from client
  - **Handles heartbeat messages**: Responds to `{"type":"heartbeat"}` with timestamp
  - **Clears serial buffer**: Removes any existing data before sending command
  - Parses JSON format: `{"token":"k", "command":"sit"}` or `{"type":"command","taskId":"123","commands":["ksit"]}`
  - Combines token+command and sends to robot: `ksit`
  - **Handles base64 encoded commands**: Decodes `b64:` prefixed commands for binary data (e.g., music commands)
  - **Adds correct terminators**: Uppercase commands (A-Z) get '~', lowercase commands get '\n' (e.g., `G~`, `i0 90\n`, `m1 45\n`)
  - **Sends immediate acknowledgment**: `{"type":"ack","command":"ksit"}`
  - **Intelligent timeout system**: Based on OpenCatEsp32/PetoiWebBlock timeout configuration
    - Movement commands (`i`, `m`, `I`, `M`): 30 seconds
    - Complex skills (`kpu`, `ksit`, `kclap`, `kpee`): 30 seconds  
    - Music/binary commands (`b`, `B`, `o`, base64): 30 seconds
    - Sensor readings (`j`, `gu`): 5 seconds
    - Simple commands: 5 seconds
    - Heartbeat timeout: 25 seconds
  - **Complete response detection**: For movement commands, waits until token confirmation is received
  - **For task commands**: `{"taskId":"123","status":"completed","results":["robot_reply"]}`
  - **For regular commands**: `{"type":"response","data":"robot_reply"}`
  - **Handles timeouts**: `{"taskId":"123","status":"error","error":"timeout"}` or `{"type":"timeout","command":"ksit"}`

### HTTP Endpoints

- `GET /` - Status page
- `GET /status` - JSON status information

## Example Web Client

Here's a simple HTML/JavaScript example for connecting to the WebSocket server:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Petoi Robot Control</title>
</head>
<body>
    <h1>Petoi Robot Control</h1>
    <div id="status">Disconnected</div>
    <input type="text" id="command" placeholder="Enter command">
    <button onclick="sendCommand()">Send</button>
    <div id="output"></div>

    <script>
        const ws = new WebSocket('ws://192.168.4.1:81');
        
        ws.onopen = function() {
            document.getElementById('status').textContent = 'Connected';
        };
        
        ws.onmessage = function(event) {
            const output = document.getElementById('output');
            output.innerHTML += '<div>' + event.data + '</div>';
        };
        
        ws.onclose = function() {
            document.getElementById('status').textContent = 'Disconnected';
        };
        
        function sendCommand() {
            const command = document.getElementById('command').value;
            if (command) {
                ws.send(JSON.stringify({
                    command: command,
                    wait: 0
                }));
                document.getElementById('command').value = '';
            }
        }
    </script>
</body>
</html>
```

## Advanced Features

### Base64 Command Processing

The system supports base64 encoded binary commands for complex data like music sequences:

```javascript
// JavaScript client example
const musicCommand = "b64:QgoBDgERAX4=";
websocket.send(JSON.stringify({
  "type": "command",
  "taskId": "12345",
  "commands": [musicCommand]
}));
```

**Decoding Process:**
1. Detects `b64:` prefix
2. Decodes base64 string to binary data
3. Sends raw bytes to robot with proper terminator
4. Example: `QgoBDgERAX4=` → `[0x42, 0x0A, 0x01, 0x0E, 0x01, 0x11, 0x01, 0x7E]`

### Intelligent Timeout Management

Based on OpenCatEsp32/PetoiWebBlock timeout configuration:

| Command Type | Timeout | Examples |
|--------------|---------|----------|
| Movement Commands | 30s | `m1 45 0 45`, `i0 90`, `M`, `I` |
| Complex Skills | 30s | `kpu`, `ksit`, `kclap`, `kpee` |
| Music/Binary | 30s | `b64:...`, `B`, music sequences |
| Sensor Reading | 5s | `j`, `gu`, gyro queries |
| Simple Commands | 5s | `d`, `khi`, basic movements |

### Task Completion Tracking

For commands with `taskId`, the system provides detailed progress tracking:

1. **Immediate Acknowledgment**: `{"type":"ack","command":"ksit"}`
2. **Task Completion**: `{"taskId":"123","status":"completed","results":["k"]}`
3. **Error Handling**: `{"taskId":"123","status":"error","error":"timeout"}`

This ensures web clients can track command execution and handle failures gracefully.

### Serial Communication Enhancements

- **Buffer Clearing**: Cleans serial buffer before sending commands
- **Smart Termination**: Automatic terminator based on command type
- **Response Collection**: Waits for complete robot responses
- **Timeout Protection**: Prevents indefinite waiting

### Compatibility & Performance

**OpenCatEsp32 Compatibility:**
- Fully compatible with PetoiWebBlock client architecture
- Matches webServer.h timeout configuration 
- Supports identical JSON command formats
- Base64 decoding algorithm matches reference implementation

**Performance Optimizations:**
- Efficient serial buffer management (40ms timeout)
- Intelligent response waiting (movement commands get extended time)
- Optimized JSON parsing with ArduinoJson 7.x
- PROGMEM usage for memory efficiency
- Smart heartbeat mechanism (25s timeout)

**Memory Management:**
- Global base64 alphabet in PROGMEM (saves RAM)
- Efficient string operations for large commands
- Proper buffer clearing to prevent memory leaks
- EEPROM optimization for settings storage

## Troubleshooting

### Common Issues

1. **WebSocket connection fails**
   - Check if ESP8266 IP address is correct
   - Ensure port 81 is not blocked by firewall
   - Verify WiFi connection

2. **Robot not responding**
   - Check serial connection between ESP8266 and robot
   - Verify robot is powered on
   - Check baud rate settings

3. **Commands not working**
   - Ensure robot is in the correct mode
   - Check if robot supports the command
   - Verify serial communication is working

4. **WiFi configuration issues**
   - Make sure to restart the device after changing SSID
   - Check that the serial command format is correct
   - Use `r` command to reset WiFi settings if needed
   - Verify EEPROM is working properly

5. **Configuration portal not appearing**
   - Check if device is in AP mode (LED should be blinking)
   - Try connecting to the AP SSID manually
   - Navigate to http://192.168.4.1 directly in browser
   - Use `r` command to force configuration mode

### Debug Information

- LED blinks every second when system is running
- Serial monitor shows connection status and commands
- WebSocket messages are logged to serial monitor
- SSID information is displayed on startup

## EEPROM Storage

The system uses EEPROM to store:
- SSID name (32 bytes, address 0-31)
- Random number (4 bytes, address 32-35)

This ensures the SSID remains consistent across reboots.

## Version History

### v2.0.0 (Current)
- **Major Feature Update**: Full OpenCatEsp32 compatibility
- Added Base64 command decoding for music and binary data
- Implemented intelligent timeout system (5-30s based on command type)
- Enhanced task completion tracking with proper client acknowledgment
- Smart terminator handling ('~' for uppercase, '\n' for lowercase)
- Improved serial communication with buffer management
- Performance optimizations and memory management
- Comprehensive error handling and timeout protection

### v1.0.0 (Initial)
- Basic WebSocket server functionality
- WiFiManager integration for easy setup
- Dynamic SSID generation with EEPROM storage
- Serial command forwarding
- Simple response handling

## Technical Architecture

**Based on:** OpenCatEsp32/src/webServer.h and PetoiWebBlock client architecture  
**Compatible with:** Petoi programblockly.html web client  
**Optimized for:** ESP8266 hardware constraints with efficient memory usage  
**Tested with:** ESP-WROOM-02D, Arduino IDE 2.x, ESP8266 Board Package 3.x

## Credits

- **Original Design**: Rongzhong Li (Petoi LLC)
- **Reference Implementation**: OpenCatEsp32/src/webServer.h
- **Timeout Configuration**: OpenCatEsp32/PetoiWebBlock/js/timeout_config.js
- **ESP8266 Adaptation**: Enhanced for ESP8266 platform constraints
- **Libraries**: WiFiManager (tzapu), WebSockets (Markus Sattler), ArduinoJson (Benoit Blanchon)

## License

This project is part of the OpenCat project and follows the same license terms. 
