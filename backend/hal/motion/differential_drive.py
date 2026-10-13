"""Differential Wheeled Mobile Base Kinematics.
Computes left and right wheel PWM speeds from linear velocity and angular yaw rate.
Applies calibration trims and instant edge-sensor safety cutoff.
"""

import time
import logging
from typing import Dict, Any, Optional
from .base import BaseMotionDriver

logger = logging.getLogger("DifferentialDrive")

class DifferentialDriveDriver(BaseMotionDriver):
    """Kinematics controller for differential-drive wheeled desktop rovers."""

    def __init__(self, left_trim: float = 1.0, right_trim: float = 0.98, max_speed: float = 0.8):
        self.left_trim = left_trim
        self.right_trim = right_trim
        self.max_speed = max_speed

        self.linear_speed = 0.0
        self.angular_speed = 0.0
        self.left_wheel = 0.0
        self.right_wheel = 0.0
        self.safety_cutoff_active = False

    def set_velocity(self, linear: float, angular: float, edge_detected: bool = False) -> Dict[str, Any]:
        """Calculates differential wheel speeds. If edge is detected, cuts power immediately."""
        if edge_detected or self.safety_cutoff_active:
            return self.emergency_stop()

        # Clamp inputs [-1.0, 1.0]
        lin = max(-1.0, min(1.0, linear)) * self.max_speed
        ang = max(-1.0, min(1.0, angular)) * self.max_speed

        # Differential kinematics: left = V - (omega * L / 2), right = V + (omega * L / 2)
        v_left = (lin - ang * 0.5) * self.left_trim
        v_right = (lin + ang * 0.5) * self.right_trim

        self.linear_speed = lin
        self.angular_speed = ang
        self.left_wheel = round(max(-1.0, min(1.0, v_left)), 3)
        self.right_wheel = round(max(-1.0, min(1.0, v_right)), 3)

        return {
            "status": "moving" if (lin != 0 or ang != 0) else "stopped",
            "linear": self.linear_speed,
            "angular": self.angular_speed,
            "left_wheel": self.left_wheel,
            "right_wheel": self.right_wheel,
            "timestamp": time.time(),
        }

    def execute_posture(self, posture_name: str) -> Dict[str, Any]:
        # For wheeled robots, postures are stationary nudges or spins
        if posture_name == "nudge_forward":
            return self.set_velocity(0.3, 0.0)
        elif posture_name == "turn_around":
            return self.set_velocity(0.0, 0.5)
        else:
            return self.set_velocity(0.0, 0.0)

    def emergency_stop(self) -> Dict[str, Any]:
        self.linear_speed = 0.0
        self.angular_speed = 0.0
        self.left_wheel = 0.0
        self.right_wheel = 0.0
        self.safety_cutoff_active = True
        logger.warning("[DifferentialDrive] EMERGENCY STOP: All motors cut to 0.0.")
        return {
            "status": "emergency_stop",
            "left_wheel": 0.0,
            "right_wheel": 0.0,
            "timestamp": time.time(),
        }

    def reset_safety(self) -> None:
        self.safety_cutoff_active = False

    def get_status(self) -> Dict[str, Any]:
        return {
            "mode": "differential_wheeled",
            "linear": self.linear_speed,
            "angular": self.angular_speed,
            "left_wheel": self.left_wheel,
            "right_wheel": self.right_wheel,
            "safety_cutoff": self.safety_cutoff_active,
        }
