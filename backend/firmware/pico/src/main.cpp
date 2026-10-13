#include "../include/protocol.h"

unsigned long g_lastTelemetryTime = 0;

void setup() {
    Serial.begin(115200);
    pinMode(PIN_MOTOR_LEFT_PWM, OUTPUT);
    pinMode(PIN_MOTOR_LEFT_DIR, OUTPUT);
    pinMode(PIN_MOTOR_RIGHT_PWM, OUTPUT);
    pinMode(PIN_MOTOR_RIGHT_DIR, OUTPUT);
    pinMode(PIN_PRIVACY_SWITCH, INPUT_PULLUP);
    
    g_lastHeartbeat = millis();
}

void loop() {
    handleSerialInput();
    updateWatchdog();

    if (millis() - g_lastTelemetryTime > 250) {
        g_lastTelemetryTime = millis();
        sendTelemetry();
    }
}
