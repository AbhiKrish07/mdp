"""
Mode Manager: Manages Docking State Machine, hot-plug transitions,
and capability fallback for Standalone (Meta Muse handheld) vs Docked mode.
"""

import time
import logging
from enum import Enum
from typing import Dict, Any, Optional

logger = logging.getLogger("ModeManager")

class DockState(str, Enum):
    STANDALONE = "STANDALONE"       # Head detached, works like Meta Muse Charm (voice, vision, screen)
    DOCKED = "DOCKED"               # Head docked on body, full robot mode (wheels + gesture arms)
    DISCONNECTED = "DISCONNECTED"   # Cable lost or dock faulted while commanded
    RECONNECTING = "RECONNECTING"   # Handshake in progress

class ModeManager:
    """
    Tracks and orchestrates the modular system states.
    Controls feature fallback when detached.
    """
    def __init__(self, body_link=None):
        self.dock_state = DockState.DOCKED
        self.body_link = body_link
        self.last_dock_transition = time.time()
        
        # Head battery (5000mAh 1S LiPo / Power Bank)
        self.head_battery_pct = 94.0
        self.head_battery_v = 5.05
        self.head_temp_c = 42.5  # Pi 5 active cooler reading
        
        # Privacy & handheld state
        self.handheld_mode_active = False

        # CMF / Industrial Finish (Matte White, Graphite Gray, Sage Green)
        self.colorway = "Matte White"

        # 2-DOF Arm Kinematics & Soft Gripper
        self.arm_kinematics = {
            "shoulder_pitch_deg": 15,    # -45 to 90 deg (Forward/Back & Up/Down)
            "elbow_rotation_deg": 40,    # 0 to 135 deg (Smooth precise control)
            "gripper_state": "release",  # "release" or "grasp" (Rubberized object-safe)
        }

        # 3-Tier Module Specification
        self.modular_specs = {
            "dimensions_mm": {"height": 270, "width": 160, "depth": 150},
            "weight_est_g": {"head": "250-350g", "body": "300-450g", "legs_feet": "200-350g", "total": "750-1,150g"},
            "colorways": ["Matte White", "Graphite Gray", "Sage Green"],
            "modules": {
                "head": {
                    "dimensions": "180 x 140 mm",
                    "weight_target": "250-350 g",
                    "components": ["2.8\" touch display", "1080p 120° FOV camera", "Far-field mic array", "3W speaker", "Raspberry Pi 5", "Active cooling", "Privacy switch", "2000-3000 mAh Li-ion", "Magnetic dock connector (5-pin pogo)"]
                },
                "torso": {
                    "weight_target": "300-450 g",
                    "components": ["ESP32 torso controller", "2-DOF articulated arms (shoulder+elbow)", "Soft grippers", "5-pin magnetic pogo dock", "Status LEDs", "Power management", "Leg mounting plate"]
                },
                "legs_feet": {
                    "footprint": "160 x 150 mm",
                    "weight_target": "200-350 g (pair)",
                    "components": ["Dual structural legs (aluminum + ABS hollow)", "Internal cable routing", "Reinforced joint", "Wide stable feet with rubber sole", "Stability sensors (load sensor/IMU)"]
                }
            }
        }

    def get_capabilities(self) -> Dict[str, Any]:
        """
        Returns list of available capabilities based on current dock state.
        """
        if self.dock_state == DockState.DOCKED:
            return {
                "mode": self.dock_state.value,
                "mobility": True,
                "gesture_arms": True,
                "edge_radar": True,
                "screen_face": True,
                "camera_vision": True,
                "voice_stt_tts": True,
                "fallback_active": False,
                "description": "Full Desktop Robot Mode (Locomotion, gesture servos, and edge sensing active)"
            }
        else:
            return {
                "mode": self.dock_state.value,
                "mobility": False,
                "gesture_arms": False,
                "edge_radar": False,
                "screen_face": True,
                "camera_vision": True,
                "voice_stt_tts": True,
                "fallback_active": True,
                "fallback_strategy": "Face animation and vocalized gesture fallback",
                "description": "Meta Muse Handheld Companion Mode (Head detached, portable battery active)"
            }

    def set_dock_state(self, state: DockState) -> Dict[str, Any]:
        """Transitions between Standalone and Docked modes."""
        prev_state = self.dock_state
        self.dock_state = state
        self.last_dock_transition = time.time()
        
        if state == DockState.STANDALONE:
            self.handheld_mode_active = True
            if self.body_link:
                # Trigger fail-safe stop on the body when head is lifted
                self.body_link.emergency_stop()
            logger.info("[ModeManager] Switched to STANDALONE (Handheld Muse Mode).")
        elif state == DockState.DOCKED:
            self.handheld_mode_active = False
            logger.info("[ModeManager] Switched to DOCKED (Robot Desktop Mode).")
        elif state == DockState.DISCONNECTED:
            if self.body_link:
                self.body_link.emergency_stop()
            logger.warning("[ModeManager] Body link DISCONNECTED!")

        return {
            "previous_state": prev_state.value,
            "current_state": self.dock_state.value,
            "handheld_active": self.handheld_mode_active,
            "capabilities": self.get_capabilities()
        }

    def dispatch_gesture(self, gesture_name: str) -> Dict[str, Any]:
        """
        Executes gesture with graceful fallback if detached.
        """
        if self.dock_state == DockState.DOCKED and self.body_link:
            # Physical gesture via body link
            res = self.body_link.send_command(gesture_name.upper(), {"speed": "smooth"})
            return {
                "execution_type": "physical_actuator",
                "gesture": gesture_name,
                "result": res
            }
        else:
            # Fallback for Standalone Muse mode
            face_map = {
                "wave": "happy",
                "point": "thinking",
                "nudge": "nudge",
                "neutral": "idle"
            }
            mapped_face = face_map.get(gesture_name.lower(), "happy")
            return {
                "execution_type": "fallback_screen_animation",
                "gesture": gesture_name,
                "face_animation": mapped_face,
                "spoken_announcement": f"I am gesturing {gesture_name} through my screen display avatar.",
                "note": "Body is detached. Hardware servo gesture redirected to on-screen facial expression."
            }

    def set_colorway(self, colorway: str) -> Dict[str, Any]:
        """Sets active CMF finish (Matte White, Graphite Gray, Sage Green)."""
        valid = ["Matte White", "Graphite Gray", "Sage Green"]
        if colorway in valid:
            self.colorway = colorway
        return {"colorway": self.colorway, "available": valid}

    def set_arm_kinematics(self, shoulder_pitch: Optional[int] = None, elbow_rot: Optional[int] = None, gripper: Optional[str] = None) -> Dict[str, Any]:
        """Sets 2-DOF arm servo pitch, elbow rotation, and soft gripper state."""
        if shoulder_pitch is not None:
            self.arm_kinematics["shoulder_pitch_deg"] = max(-45, min(90, shoulder_pitch))
        if elbow_rot is not None:
            self.arm_kinematics["elbow_rotation_deg"] = max(0, min(135, elbow_rot))
        if gripper in ["release", "grasp"]:
            self.arm_kinematics["gripper_state"] = gripper
        return {"arm_kinematics": self.arm_kinematics}

    def read_system_telemetry(self) -> Dict[str, Any]:
        """Aggregates telemetry from head and body."""
        body_telemetry = self.body_link.read_telemetry() if self.body_link else {}
        return {
            "dock_state": self.dock_state.value,
            "handheld_mode": self.handheld_mode_active,
            "colorway": self.colorway,
            "arm_kinematics": self.arm_kinematics,
            "modular_specs": self.modular_specs,
            "head": {
                "battery_pct": round(self.head_battery_pct, 1),
                "battery_v": round(self.head_battery_v, 2),
                "temp_c": self.head_temp_c,
                "power_source": "5000mAh LiPo / USB-C PD Rail"
            },
            "body": body_telemetry,
            "capabilities": self.get_capabilities()
        }

