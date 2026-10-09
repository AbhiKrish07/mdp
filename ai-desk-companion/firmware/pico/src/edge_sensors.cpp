#include "../include/protocol.h"

void readEdgeSensors() {
    int leftVal = analogRead(PIN_IR_FRONT_LEFT);
    int rightVal = analogRead(PIN_IR_FRONT_RIGHT);

    // Edge trip condition (voltage drop indicating floor gap)
    if (leftVal < 200 || rightVal < 200) {
        g_hwState.edge_trip = true;
        emergencyStop();
    } else {
        g_hwState.edge_trip = false;
    }
}
