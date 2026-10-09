#ifndef PROTOCOL_H
#define PROTOCOL_H

#include <Arduino.h>
#include <ArduinoJson.h>

// Pin Mappings for Raspberry Pi Pico (RP2040)
#define PIN_MOTOR_LEFT_PWM 12
#define PIN_MOTOR_LEFT_DIR 16
#define PIN_MOTOR_RIGHT_PWM 13
#define PIN_MOTOR_RIGHT_DIR 20

#define PIN_SERVO_LEFT_ARM 0
#define PIN_SERVO_RIGHT_ARM 1
#define PIN_SERVO_HEAD_TILT 2

#define PIN_IR_FRONT_LEFT A0
#define PIN_IR_FRONT_RIGHT A1
#define PIN_PRIVACY_SWITCH 28

#define WATCHDOG_TIMEOUT_MS 2000

struct HardwareState {
    bool edge_trip;
    bool watchdog_ok;
    bool privacy_switch;
    float battery_v;
    int servo_angles[3]; // left arm, right arm, head
};

void initHardware();
void updateWatchdog();
void handleSerialInput();
void sendTelemetry();
void emergencyStop();

#endif
