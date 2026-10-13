#include "../include/protocol.h"

unsigned long g_lastHeartbeat = 0;
HardwareState g_hwState = { false, true, false, 5.0, {90, 90, 90} };

void updateWatchdog() {
    if (millis() - g_lastHeartbeat > WATCHDOG_TIMEOUT_MS) {
        g_hwState.watchdog_ok = false;
        emergencyStop();
    }
}

void emergencyStop() {
    // Cut motor power and center servos safely
    analogWrite(PIN_MOTOR_LEFT_PWM, 0);
    analogWrite(PIN_MOTOR_RIGHT_PWM, 0);
}
