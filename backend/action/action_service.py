"""
Action Layer Service
Controls robot actuators: face animation state machine, arm gestures (wave, point, nudge), head tilt servos, motor wheels, and TTS audio output.
Includes edge-sensor safety cutoff for desk mobility.
"""

import time
from typing import Dict, Any, List

class ActionService:
    def __init__(self, settings: Dict[str, Any] = None, calibration: Dict[str, Any] = None):
        self.settings = settings or {}
        self.calibration = calibration or {}
        
        # State machine states
        self.face_state = "idle" # idle, listening, thinking, speaking, happy, alert, nudge
        self.current_gesture = "neutral" # neutral, wave, point, nudge
        self.head_angle = 90
        self.wheel_speed = 0.0
        
        # Edge safety cutoff trigger
        self.safety_cutoff_active = False

    def set_face_state(self, state: str):
        """Update animated eye/expression state machine."""
        valid_states = ["idle", "listening", "thinking", "speaking", "happy", "alert", "nudge"]
        if state in valid_states:
            self.face_state = state
            print(f"[ActionService] Face state transition -> {self.face_state}")

    def execute_arm_gesture(self, gesture_name: str) -> Dict[str, Any]:
        """Controls small servo-driven arms for gestures (pointing, waving, nudging)."""
        valid_gestures = ["neutral", "wave", "point", "nudge"]
        if gesture_name not in valid_gestures:
            gesture_name = "neutral"
            
        self.current_gesture = gesture_name
        
        servo_commands = []
        if gesture_name == "wave":
            servo_commands = [
                {"arm": "right", "angle": 140, "duration": 0.3},
                {"arm": "right", "angle": 70, "duration": 0.3},
                {"arm": "right", "angle": 90, "duration": 0.3}
            ]
        elif gesture_name == "point":
            servo_commands = [
                {"arm": "left", "angle": 150, "duration": 0.5},
                {"arm": "head", "angle": 110, "duration": 0.3}
            ]
        elif gesture_name == "nudge":
            servo_commands = [
                {"arm": "left", "angle": 110, "duration": 0.2},
                {"arm": "left", "angle": 90, "duration": 0.2}
            ]
        else:
            servo_commands = [
                {"arm": "left", "angle": 90, "duration": 0.2},
                {"arm": "right", "angle": 90, "duration": 0.2}
            ]
            
        return {
            "gesture": gesture_name,
            "servo_commands": servo_commands,
            "timestamp": time.time()
        }

    def set_motor_wheels(self, linear_speed: float, angular_speed: float, edge_sensors: Dict[str, float] = None) -> Dict[str, Any]:
        """Drive wheeled base with automatic edge-sensor safety cutoff."""
        # Edge safety cutoff check
        if edge_sensors and edge_sensors.get("is_edge_detected", False):
            self.safety_cutoff_active = True
            self.wheel_speed = 0.0
            print("[ActionService] SAFETY CUTOFF ENGAGED! Edge detected on desk surface. Wheels stopped.")
            return {
                "status": "safety_cutoff_engaged",
                "linear": 0.0,
                "angular": 0.0
            }

        self.safety_cutoff_active = False
        self.wheel_speed = linear_speed
        return {
            "status": "moving",
            "linear": linear_speed,
            "angular": angular_speed
        }

    def speak_text(self, text: str) -> Dict[str, Any]:
        """Audio TTS playback dispatch."""
        self.set_face_state("speaking")
        # Speech playback duration estimation based on word count
        words = text.split()
        estimated_sec = max(1.5, len(words) * 0.3)
        return {
            "text": text,
            "audio_duration_sec": estimated_sec,
            "engine": self.settings.get("tts_engine", "piper")
        }
