/*
 * WebCoding8266.ino
 * 
 * ESP8266 WebSocket Server for Petoi Robot Control
 * This program creates a WebSocket server that accepts connections from web clients
 * and forwards commands to the serial port for controlling the Petoi robot.
 * 
 * Uses WiFiManager for easy WiFi configuration through captive portal
 * 
 * Based on test8266Master.ino and ESP8266WiFiController.ino
 * 
 * Rongzhong Li
 * Dec. 2024
 */

#include <ESP8266WiFi.h>
#include <DNSServer.h>
#include <ESP8266WebServer.h>
#include <WiFiManager.h>         // https://github.com/tzapu/WiFiManager
#include <WebSocketsServer.h>
#include <ArduinoJson.h>
#include <EEPROM.h>

// EEPROM addresses for AP name configuration
#define EEPROM_SIZE 512
#define SSID_NAME_ADDR 0
#define SSID_NAME_LEN 32
#define RANDOM_NUM_ADDR 32
#define RANDOM_NUM_LEN 4

// WiFi configuration
String ssidName = "Petoi";  // Base name, will be appended with random number
String fullSSID = "";       // Full SSID with random number

// WebSocket server
WebSocketsServer webSocket = WebSocketsServer(81);
ESP8266WebServer server(80);

// Serial communication settings
#define SERIAL_BAUD_RATE 115200
#define SERIAL_TIMEOUT 40  // Match ESP8266WiFiController setting

// WebSocket & Command timeout configurations (milliseconds)
// Based on OpenCatEsp32/PetoiWebBlock/js/timeout_config.js and src/webServer.h
#define DEFAULT_COMMAND_TIMEOUT 5000       // Default command timeout: 5 seconds
#define MOVEMENT_COMMAND_TIMEOUT 30000     // Movement commands (i, m): 30 seconds  
#define SIMPLE_COMMAND_TIMEOUT 5000        // Simple commands: 5 seconds
#define SENSOR_READ_TIMEOUT 5000           // Sensor reading: 5 seconds
#define HEARTBEAT_TIMEOUT 25000            // Heartbeat timeout: 25 seconds
#define TASK_EXECUTION_TIMEOUT 30000       // Task execution timeout: 30 seconds

// LED indicator
#define BUILTIN_LED 2

// Connection status
bool robotConnected = false;
bool webSocketConnected = false;

// JSON document for parsing commands
JsonDocument doc;

// Function declarations
void loadOrGenerateSSID();
void generateNewSSID();
void saveSSIDToEEPROM(String name, String randomNum);
void handleSSIDChange(String command);
void setupWiFi();
void connectToRobot();
void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length);
unsigned long getCommandTimeout(String command);
String base64Decode(String input);

void handleRoot();
void handleStatus();
String getIPAddress();
String getEncryptionType(uint8_t encType);
void clearEEPROM();

void setup() {
  // Initialize LED first (for early indication)
  pinMode(BUILTIN_LED, OUTPUT);
  digitalWrite(BUILTIN_LED, LOW);
  
  // Wait for system to stabilize
  delay(1000);
  
  // Initialize serial communication
  Serial.begin(SERIAL_BAUD_RATE);
  Serial.setTimeout(SERIAL_TIMEOUT);
  
  // Wait for serial to be ready and flush any garbage
  delay(100);
  while (Serial.available()) {
    Serial.read();
  }
  Serial.flush();
  

  
  // Initialize EEPROM
  EEPROM.begin(EEPROM_SIZE);
  
  // Load or generate SSID for AP mode
  loadOrGenerateSSID();
  
  // Setup WiFi with WiFiManager
  setupWiFi();
  
  // Setup WebSocket server
  webSocket.begin();
  webSocket.onEvent(webSocketEvent);
  
  // Setup HTTP server for basic status
  server.on("/", handleRoot);
  server.on("/status", handleStatus);
  server.begin();
  
  delay(2000);
  
  // Try to connect to robot
  connectToRobot();
}

void loop() {
  // Handle WebSocket events
  webSocket.loop();
  
  // Handle HTTP server
  server.handleClient();
  
  // Check serial for ESP8266 configuration commands only
  // Robot responses are now handled in WebSocket event handler
  if (Serial.available()) {
    String input = Serial.readString();
    if (input.length() > 0) {
      // Only process ESP8266 configuration commands
      if (input.startsWith("n")) {
        handleSSIDChange(input);
      } else if (input.startsWith("w!")) {
        // Clear WiFi settings command
        WiFiManager wifiManager;
        wifiManager.resetSettings();
      } else if (input.startsWith("E")) {
        clearEEPROM();
      } else if (input.startsWith("r")) {
        // Reset WiFi settings command
        WiFiManager wifiManager;
        wifiManager.resetSettings();
      }
      // Note: Robot responses are handled in WebSocket event handler, not here
    }
  }
  
  // Blink LED to show system is running
  static unsigned long lastBlink = 0;
  if (millis() - lastBlink > 1000) {
    digitalWrite(BUILTIN_LED, !digitalRead(BUILTIN_LED));
    lastBlink = millis();
  }
}

void loadOrGenerateSSID() {
  
  // Try to load existing SSID name from EEPROM
  String savedName = "";
  bool validName = true;
  
  for (int i = 0; i < SSID_NAME_LEN; i++) {
    char c = EEPROM.read(SSID_NAME_ADDR + i);
    if (c == 0) break;
    // Check for valid ASCII characters (printable)
    if (c < 32 || c > 126) {
      validName = false;
      break;
    }
    savedName += c;
  }
  
  // Try to load existing random number from EEPROM
  String savedRandom = "";
  bool validRandom = true;
  
  for (int i = 0; i < RANDOM_NUM_LEN; i++) {
    char c = EEPROM.read(RANDOM_NUM_ADDR + i);
    if (c == 0) break;
    // Check for valid digit characters
    if (c < '0' || c > '9') {
      validRandom = false;
      break;
    }
    savedRandom += c;
  }
  
  // Check if we have valid saved data
  if (validName && savedName.length() > 0 && savedName.length() < SSID_NAME_LEN) {
    ssidName = savedName;
    if (validRandom && savedRandom.length() == 4) {
      // User has not manually changed SSID, keep random number
      fullSSID = savedName + "-AP" + savedRandom;
    } else {
      // User has manually changed SSID, no random number
      fullSSID = savedName + "-AP";
    }
  } else {
    // EEPROM data is corrupted or empty, generate new
    generateNewSSID();
  }
}

void generateNewSSID() {
  // Generate 4-digit random number
  String randomNum = String(random(1000, 9999));
  
  // Save to EEPROM
  saveSSIDToEEPROM(ssidName, randomNum);
  
  // Set full SSID
  fullSSID = ssidName + "-AP" + randomNum;
}

void saveSSIDToEEPROM(String name, String randomNum) {
  // Save SSID name
  for (int i = 0; i < SSID_NAME_LEN; i++) {
    if (i < name.length()) {
      EEPROM.write(SSID_NAME_ADDR + i, name.charAt(i));
    } else {
      EEPROM.write(SSID_NAME_ADDR + i, 0);
    }
  }
  
  // Save random number
  for (int i = 0; i < RANDOM_NUM_LEN; i++) {
    if (i < randomNum.length()) {
      EEPROM.write(RANDOM_NUM_ADDR + i, randomNum.charAt(i));
    } else {
      EEPROM.write(RANDOM_NUM_ADDR + i, 0);
    }
  }
  
  EEPROM.commit();
}

void handleSSIDChange(String command) {
  // Format: n[newName] - e.g., nLittleDog
  if (command.length() > 1) {
    String newName = command.substring(1); // Remove 'n' prefix
    
    // Update SSID name without random number
    ssidName = newName;
    fullSSID = newName + "-AP";
    
    // Save to EEPROM (clear random number)
    saveSSIDToEEPROM(newName, "");
    

  } else {
    Serial.println("Usage: n[newName] - e.g., nLittleDog");
  }
}

void setupWiFi() {
  
  // WiFiManager
  WiFiManager wifiManager;
  
  // Silent operation - no callback messages
  
  // Set configuration portal timeout (3 minutes)
  wifiManager.setConfigPortalTimeout(180);
  
  // Try to connect to saved WiFi, if not available start configuration portal
  if (!wifiManager.autoConnect(fullSSID.c_str())) {
    delay(3000);
    ESP.restart();
  }
  
  // Turn on LED to indicate successful connection
  digitalWrite(BUILTIN_LED, HIGH);
}

void connectToRobot() {
  bool connected = false;
  int attempts = 0;
  
  while (!connected && attempts < 10) {
    Serial.print("b 20 8 22 8 24 8");
    for (byte t = 0; t < 100; t++) {
      if (Serial.available()) {
        if (Serial.read() == 'b') {
          connected = true;
          while (Serial.available() && Serial.read());
          break;
        }
      }
      delay(10);
    }
    delay(1000);
    attempts++;
  }
  
  robotConnected = connected;
}

void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      webSocketConnected = false;
      break;
      
    case WStype_CONNECTED:
      {
        webSocketConnected = true;
        // Send welcome message
        String welcomeMsg = "{\"type\":\"status\",\"message\":\"Connected\"}";
        webSocket.sendTXT(num, welcomeMsg);
      }
      break;
      
    case WStype_TEXT:
      {
        // Handle incoming command
        String command = String((char*)payload);
        String finalCommand = "";
        String taskId = ""; // Store taskId for completion response
        
        // Parse JSON command to extract token and command
        DeserializationError error = deserializeJson(doc, command);
        
        if (!error) {
          // Handle different JSON command formats
          if (doc.containsKey("type")) {
            String msgType = doc["type"].as<String>();
            
            // Handle heartbeat messages
            if (msgType == "heartbeat") {
              // Send heartbeat response
              String heartbeatResponse = "{\"type\":\"heartbeat\",\"timestamp\":" + String(millis()) + "}";
              webSocket.sendTXT(num, heartbeatResponse);
              return;
            }
            
            // Filter out other system messages
            if (msgType == "ping" || msgType == "status") {
              return; // Ignore system messages
            }
            
            // Handle command type with commands array
            if (msgType == "command" && doc.containsKey("commands")) {
              JsonArray cmdArray = doc["commands"];
              if (cmdArray.size() > 0) {
                finalCommand = cmdArray[0].as<String>(); // Take first command
                
                // Store taskId for completion response
                if (doc.containsKey("taskId")) {
                  taskId = doc["taskId"].as<String>();
                }
              }
            }
          }
          // Handle token + command format
          else if (doc.containsKey("token") && doc.containsKey("command")) {
            String token = doc["token"].as<String>();
            String cmd = doc["command"].as<String>();
            finalCommand = token + cmd;
          }
          // Handle simple command format
          else if (doc.containsKey("command")) {
            finalCommand = doc["command"].as<String>();
          }
        } else {
          // If not JSON or malformed, treat as direct command
          finalCommand = command;
        }
        
        // Handle base64 encoded commands (like music commands)
        if (finalCommand.startsWith("b64:")) {
          String base64Cmd = finalCommand.substring(4);
          String decodedString = base64Decode(base64Cmd);
          if (decodedString.length() > 0) {
            // For base64 commands, we need to send raw bytes to serial
            // The decoded string contains token + binary data
            finalCommand = decodedString;
          }
        }
        
        // Send command to robot and wait for response
        if (robotConnected && finalCommand.length() > 0) {
          // Clear any existing data in serial buffer
          while (Serial.available()) {
            Serial.read();
          }
          
          // Check if this is a base64 decoded command (binary data)
          bool isBase64Command = command.indexOf("b64:") >= 0;
          
          if (isBase64Command) {
            // For base64 decoded commands, send raw bytes
            for (int i = 0; i < finalCommand.length(); i++) {
              Serial.write((uint8_t)finalCommand.charAt(i));
            }
            // Add terminator for uppercase tokens in base64 commands
            if (finalCommand.length() > 0 && finalCommand.charAt(0) >= 'A' && finalCommand.charAt(0) <= 'Z') {
              Serial.write('~');
            }
          } else {
            // For regular commands, add correct terminator based on OpenCat/src/io.h logic:
            // - Uppercase tokens (A-Z) use '~' terminator for binary encoding
            // - Lowercase tokens use '\n' terminator for ASCII encoding
            if (finalCommand.length() > 0) {
              char firstChar = finalCommand.charAt(0);
              if (firstChar >= 'A' && firstChar <= 'Z') {
                // Uppercase tokens need '~' terminator
                finalCommand += '~';
              } else {
                // Lowercase tokens need '\n' terminator
                finalCommand += '\n';
              }
            }
            
            // Send to robot
            Serial.print(finalCommand);
          }
          
          // Send immediate acknowledgment to client
          String ackResponse = "{\"type\":\"ack\",\"command\":\"" + finalCommand + "\"}";
          webSocket.sendTXT(num, ackResponse);
          
          // Wait for response and send back to WebSocket client
          // Get appropriate timeout based on command type
          unsigned long timeout = getCommandTimeout(finalCommand);
          bool isMovementCommand = (finalCommand.charAt(0) == 'm' || finalCommand.charAt(0) == 'i');
          delay(isMovementCommand ? 100 : 50); // More delay for movement commands
          String response = "";
          unsigned long startTime = millis();
          bool responseReceived = false;
          
          while (millis() - startTime < timeout && !responseReceived) {
            if (Serial.available()) {
              String chunk = Serial.readString();
              if (chunk.length() > 0) {
                response += chunk;
                chunk.trim();
                
                // For movement commands, wait for complete response (containing the token)
                if (isMovementCommand) {
                  // Check if we received the token confirmation (like 'm' for movement commands)
                  if (response.indexOf(String(finalCommand.charAt(0))) >= 0) {
                    responseReceived = true;
                  }
                } else {
                  // For other commands, first response is enough
                  responseReceived = true;
                }
              }
            }
            delay(isMovementCommand ? 10 : 5); // Longer check interval for movement commands
          }
          
          if (responseReceived && response.length() > 0) {
            response.trim(); // Clean up response
            
            // Send task completion signal in the format expected by client
            if (taskId.length() > 0) {
              String taskCompleteResponse = "{\"taskId\":\"" + taskId + "\",\"status\":\"completed\",\"results\":[\"" + response + "\"]}";
              webSocket.sendTXT(num, taskCompleteResponse);
            } else {
              // For non-task commands, send regular response
              String jsonResponse = "{\"type\":\"response\",\"data\":\"" + response + "\"}";
              webSocket.sendTXT(num, jsonResponse);
            }
          }
          
          // If no complete response received, send timeout notification
          if (!responseReceived) {
            if (taskId.length() > 0) {
              String taskErrorResponse = "{\"taskId\":\"" + taskId + "\",\"status\":\"error\",\"error\":\"timeout\"}";
              webSocket.sendTXT(num, taskErrorResponse);
            } else {
              String timeoutResponse = "{\"type\":\"timeout\",\"command\":\"" + finalCommand + "\"}";
              webSocket.sendTXT(num, timeoutResponse);
            }
          }
        }
      }
      break;
  }
}



void handleRoot() {
  String html = "<!DOCTYPE html><html><head><title>Petoi Robot WebSocket Controller</title></head>";
  html += "<body><h1>Petoi Robot WebSocket Controller</h1>";
  html += "<p>Status: ";
  html += robotConnected ? "Robot Connected" : "Robot Disconnected";
  html += "</p>";
  html += "<p>WebSocket: ";
  html += webSocketConnected ? "Connected" : "Disconnected";
  html += "</p>";
  
  String ipAddress = WiFi.localIP().toString();
  html += "<p>Connect to WebSocket at ws://" + ipAddress + ":81</p>";
  html += "<p>WiFi: " + WiFi.SSID() + " (Signal: " + String(WiFi.RSSI()) + " dBm)</p>";
  html += "</body></html>";
  
  server.send(200, "text/html", html);
}

void handleStatus() {
  String ipAddress = WiFi.localIP().toString();
  
  String status = "{\"robot_connected\":" + String(robotConnected ? "true" : "false") + ",";
  status += "\"websocket_connected\":" + String(webSocketConnected ? "true" : "false") + ",";
  status += "\"ip\":\"" + ipAddress + "\",";
  status += "\"wifi_ssid\":\"" + WiFi.SSID() + "\",";
  status += "\"wifi_rssi\":" + String(WiFi.RSSI()) + "}";
  
  server.send(200, "application/json", status);
}

String getIPAddress() {
  return WiFi.localIP().toString();
}

String getEncryptionType(uint8_t encType) {
  switch (encType) {
    case ENC_TYPE_WEP:
      return "WEP";
    case ENC_TYPE_TKIP:
      return "WPA/PSK";
    case ENC_TYPE_CCMP:
      return "WPA2/PSK";
    case ENC_TYPE_NONE:
      return "OPEN";
    case ENC_TYPE_AUTO:
      return "WPA/WPA2/PSK";
    default:
      return "UNKNOWN";
  }
}

// Function to clear EEPROM data (can be called via serial command 'E')
void clearEEPROM() {
  for (int i = 0; i < EEPROM_SIZE; i++) {
    EEPROM.write(i, 0);
  }
  EEPROM.commit();
}

// Get appropriate timeout based on command type
// Based on OpenCatEsp32/PetoiWebBlock/js/timeout_config.js
unsigned long getCommandTimeout(String command) {
  if (command.length() == 0) return DEFAULT_COMMAND_TIMEOUT;
  
  char firstChar = command.charAt(0);
  
  // Movement commands (indexed joint control)
  if (firstChar == 'm' || firstChar == 'i' || firstChar == 'M' || firstChar == 'I') {
    return MOVEMENT_COMMAND_TIMEOUT; // 30 seconds
  }
  
  // Sensor reading commands
  if (firstChar == 'j' || command.startsWith("gu")) {
    return SENSOR_READ_TIMEOUT; // 5 seconds
  }
  
  // Complex action commands (skills)
  if (firstChar == 'k') {
    // Check for complex actions that need more time
    if (command.indexOf("clap") >= 0 || command.indexOf("pee") >= 0 || 
        command.indexOf("pu") >= 0 || command.indexOf("sit") >= 0) {
      return MOVEMENT_COMMAND_TIMEOUT; // 30 seconds for complex skills
    }
    return SIMPLE_COMMAND_TIMEOUT; // 5 seconds for simple skills
  }
  
  // Music/beep commands
  if (firstChar == 'b' || firstChar == 'B' || firstChar == 'o') {
    return MOVEMENT_COMMAND_TIMEOUT; // 30 seconds for music
  }
  
  // Default for other commands
  return SIMPLE_COMMAND_TIMEOUT; // 5 seconds
}

// Base64 alphabet as global constant for PROGMEM
const char PROGMEM b64_alphabet[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

// Base64 decode function
// Based on OpenCatEsp32/src/webServer.h implementation
String base64Decode(String input) {
  String result = "";
  int val = 0, valb = -8;
  
  for (char c : input) {
    if (c == '=') break;
    
    int index = -1;
    for (int i = 0; i < 64; i++) {
      if (pgm_read_byte(&b64_alphabet[i]) == c) {
        index = i;
        break;
      }
    }
    
    if (index == -1) continue;
    
    val = (val << 6) | index;
    valb += 6;
    
    if (valb >= 0) {
      result += char((val >> valb) & 0xFF);
      valb -= 8;
    }
  }
  
  return result;
}
