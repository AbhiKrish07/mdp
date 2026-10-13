import pytest
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from services.body_link import BodyLink, ModeManager, DockState

def test_bodylink_packet_and_emergency_stop():
    link = BodyLink()
    
    # Heartbeat
    hb = link.ping_heartbeat()
    assert hb["status"] == "dispatched"
    assert hb["action"] == "HEARTBEAT"
    
    # Movement command
    res = link.send_command("MOVE_FORWARD", {"speed": 0.2})
    assert res["status"] == "dispatched"
    assert link._sim_motor_moving == True
    
    # Emergency stop
    stop_res = link.emergency_stop()
    assert stop_res["status"] == "dispatched"
    assert link._sim_motor_moving == False

def test_cliff_sensor_tripping():
    link = BodyLink()
    link.set_cliff_sensor("center", True)
    
    # Forward movement should be rejected on cliff trip
    res = link.send_command("MOVE_FORWARD", {"speed": 0.2})
    assert res["status"] == "rejected"
    assert res["reason"] == "CLIFF_SENSOR_SAFETY_TRIP"

def test_mode_manager_dock_and_standalone_fallback():
    link = BodyLink()
    manager = ModeManager(body_link=link)
    
    # Default is DOCKED
    caps = manager.get_capabilities()
    assert caps["mobility"] == True
    assert caps["gesture_arms"] == True
    
    # Dispatch physical gesture
    g_res = manager.dispatch_gesture("wave")
    assert g_res["execution_type"] == "physical_actuator"
    
    # Switch to STANDALONE (Meta Muse handheld mode)
    manager.set_dock_state(DockState.STANDALONE)
    caps_standalone = manager.get_capabilities()
    assert caps_standalone["mobility"] == False
    assert caps_standalone["gesture_arms"] == False
    assert caps_standalone["fallback_active"] == True
    
    # Gesture in standalone falls back to screen animation
    g_res2 = manager.dispatch_gesture("wave")
    assert g_res2["execution_type"] == "fallback_screen_animation"
    assert g_res2["face_animation"] == "happy"
