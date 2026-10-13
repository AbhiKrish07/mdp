import pytest
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from action.action_service import ActionService

def test_action_gestures_and_safety_cutoff():
    action = ActionService()
    
    # Test face state transitions
    action.set_face_state("happy")
    assert action.face_state == "happy"

    # Test arm gestures
    wave = action.execute_arm_gesture("wave")
    assert wave["gesture"] == "wave"
    assert len(wave["servo_commands"]) > 0

    point = action.execute_arm_gesture("point")
    assert point["gesture"] == "point"

    # Test edge safety cutoff on motors
    edge_detected = {"is_edge_detected": True, "front_left_cm": 2.0}
    motor_res = action.set_motor_wheels(linear_speed=0.5, angular_speed=0.0, edge_sensors=edge_detected)
    assert motor_res["status"] == "safety_cutoff_engaged"
    assert action.safety_cutoff_active == True
