"""Generalized Quadruped Gait & Posture Sequencer.
Implements 4-legged robot postures (sit, stand, walk, trot, stretch, rest, wave).
Replaces the OpenCat-Quadruped-Robot repository with a modular Python kinematics sequencer.
"""

import time
import logging
from typing import Dict, Any, List
from .base import BaseMotionDriver

logger = logging.getLogger("QuadrupedGait")

class QuadrupedGaitDriver(BaseMotionDriver):
    """Kinematics controller for 4-legged quadruped companion robots."""

    # 8-servo joint angles dictionary: FL_shoulder, FL_leg, FR_shoulder, FR_leg, BL_shoulder, BL_leg, BR_shoulder, BR_leg
    POSTURES: Dict[str, Dict[str, int]] = {
        "stand": {
            "fl_shoulder": 0, "fl_leg": 30, "fr_shoulder": 0, "fr_leg": 30,
            "bl_shoulder": 0, "bl_leg": 30, "br_shoulder": 0, "br_leg": 30,
        },
        "sit": {
            "fl_shoulder": 0, "fl_leg": 20, "fr_shoulder": 0, "fr_leg": 20,
            "bl_shoulder": 0, "bl_leg": 75, "br_shoulder": 0, "br_leg": 75,
        },
        "stretch": {
            "fl_shoulder": 0, "fl_leg": 60, "fr_shoulder": 0, "fr_leg": 60,
            "bl_shoulder": 0, "bl_leg": 15, "br_shoulder": 0, "br_leg": 15,
        },
        "rest": {
            "fl_shoulder": 0, "fl_leg": 85, "fr_shoulder": 0, "fr_leg": 85,
            "bl_shoulder": 0, "bl_leg": 85, "br_shoulder": 0, "br_leg": 85,
        },
        "wave": {
            "fl_shoulder": 45, "fl_leg": 90, "fr_shoulder": 0, "fr_leg": 30,
            "bl_shoulder": 0, "bl_leg": 75, "br_shoulder": 0, "br_leg": 75,
        },
    }

    def __init__(self):
        self.active_posture = "sit"
        self.current_joint_angles = dict(self.POSTURES["sit"])
        self.is_moving = False
        self.safety_cutoff_active = False

    def set_velocity(self, linear: float, angular: float) -> Dict[str, Any]:
        """Trot/walk gait cycle based on speed inputs."""
        if self.safety_cutoff_active:
            return self.emergency_stop()

        if abs(linear) > 0.05 or abs(angular) > 0.05:
            self.active_posture = "trot" if abs(linear) > 0.5 else "walk"
            self.is_moving = True
        else:
            self.active_posture = "stand"
            self.is_moving = False

        return {
            "status": "walking" if self.is_moving else "standing",
            "gait": self.active_posture,
            "linear": linear,
            "angular": angular,
            "timestamp": time.time(),
        }

    def execute_posture(self, posture_name: str) -> Dict[str, Any]:
        """Commands pre-defined kinematic pose."""
        name = posture_name.lower()
        if name in self.POSTURES:
            self.active_posture = name
            self.current_joint_angles = dict(self.POSTURES[name])
            logger.info(f"[QuadrupedGait] Executed posture: '{name}'")
            return {
                "status": "ok",
                "posture": name,
                "joint_angles": self.current_joint_angles,
                "timestamp": time.time(),
            }
        else:
            logger.warning(f"[QuadrupedGait] Unknown posture '{name}', defaulting to 'stand'")
            return self.execute_posture("stand")

    def emergency_stop(self) -> Dict[str, Any]:
        self.is_moving = False
        self.safety_cutoff_active = True
        # Lower center of gravity to rest posture
        return self.execute_posture("rest")

    def reset_safety(self) -> None:
        self.safety_cutoff_active = False

    def get_status(self) -> Dict[str, Any]:
        return {
            "mode": "quadruped_legged",
            "posture": self.active_posture,
            "joint_angles": self.current_joint_angles,
            "safety_cutoff": self.safety_cutoff_active,
        }
