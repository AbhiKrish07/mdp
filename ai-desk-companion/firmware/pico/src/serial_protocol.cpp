#include "../include/protocol.h"

extern HardwareState g_hwState;
extern unsigned long g_lastHeartbeat;

void parseCommand(const char* jsonStr) {
    StaticJsonDocument<256> doc;
    DeserializationError err = deserializeJson(doc, jsonStr);
    if (err) {
        StaticJsonDocument<128> errDoc;
        errDoc["t"] = "ack";
        errDoc["status"] = "error";
        errDoc["msg"] = "json_parse_error";
        serializeJson(errDoc, Serial);
        Serial.println();
        return;
    }

    const char* type = doc["t"] | "";
    
    if (strcmp(type, "heartbeat") == 0) {
        g_lastHeartbeat = millis();
        g_hwState.watchdog_ok = true;
    } else if (strcmp(type, "gesture") == 0) {
        const char* name = doc["name"] | "neutral";
        // Execute servo gesture sequence
    } else if (strcmp(type, "motor") == 0) {
        if (!g_hwState.edge_trip) {
            float speed = doc["speed"] | 0.0;
            // Apply motor speed
        }
    }

    StaticJsonDocument<128> ackDoc;
    ackDoc["t"] = "ack";
    ackDoc["status"] = "ok";
    serializeJson(ackDoc, Serial);
    Serial.println();
}

void handleSerialInput() {
    if (Serial.available()) {
        String line = Serial.readStringUntil('\n');
        line.trim();
        if (line.length() > 0) {
            parseCommand(line.c_str());
        }
    }
}

void sendTelemetry() {
    StaticJsonDocument<256> doc;
    doc["t"] = "telemetry";
    doc["edge_trip"] = g_hwState.edge_trip;
    doc["watchdog_ok"] = g_hwState.watchdog_ok;
    doc["privacy_switch"] = g_hwState.privacy_switch;
    doc["battery_v"] = g_hwState.battery_v;
    serializeJson(doc, Serial);
    Serial.println();
}
