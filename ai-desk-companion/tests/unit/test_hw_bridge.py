import pytest
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from services.hw_bridge.serial_link import SerialLinkBridge

def test_serial_link_command_formatting():
    bridge = SerialLinkBridge()
    success = bridge.send_command("gesture", {"name": "wave"})
    assert success == True
    
    telemetry = bridge.read_telemetry()
    assert "edge_trip" in telemetry
    assert "watchdog_ok" in telemetry
