import pytest
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sensing.sensing_service import SensingService

def test_privacy_switch():
    sensing = SensingService()
    assert sensing.privacy_switch_active == False
    
    # Engage privacy switch
    state = sensing.toggle_privacy_switch(True)
    assert state == True
    assert sensing.read_mic_level() == 0.0
    frame = sensing.capture_frame()
    assert frame["status"] == "blocked_by_privacy_switch"

def test_ir_sensors():
    sensing = SensingService()
    ir_data = sensing.read_ir_sensors()
    assert "front_left_cm" in ir_data
    assert "front_right_cm" in ir_data
