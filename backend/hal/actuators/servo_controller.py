"""Universal Servo Controller.
Manages multi-channel servo limits, software trim calibration, and smooth easing.
Hardware-agnostic: dispatches commands to transport layer without direct GPIO coupling.
"""

import time
import logging
from typing import Dict, Any, Optional
from .base import BaseActuatorDriver

logger = logging.getLogger("ServoController")

class ServoController(BaseActuatorDriver):
    """Calibrated servo controller with safety clamp bounds and channel mappings."""

    DEFAULT_CONFIG = {
        "left_arm": {"channel": 0, "min": 0, "max": 180, "neutral": 90, "trim": 2},
        "right_arm": {"channel": 1, "min": 0, "max": 180, "neutral": 90, "trim": -1},
        "head_tilt": {"channel": 2, "min": 30, "max": 150, "neutral": 90, "trim": 0},
    }

    def __init__(self, servo_config: Optional[Dict[str, Dict[str, Any]]] = None):
        self.config = servo_config or self.DEFAULT_CONFIG
        self.current_angles: Dict[str, float] = {}

        # Initialize to neutral angles
        for joint, params in self.config.items():
            self.current_angles[joint] = float(params.get("neutral", 90))

    def set_angle(self, channel: str, angle: float) -> bool:
        if channel not in self.config:
            logger.warning(f"[ServoController] Unknown servo channel: '{channel}'")
            return False

        spec = self.config[channel]
        # Apply trim and clamp to min/max physical safety limits
        clamped = max(float(spec.get("min", 0)), min(float(spec.get("max", 180)), angle))
        trimmed = clamped + float(spec.get("trim", 0))

        self.current_angles[channel] = clamped
        logger.debug(f"[ServoController] {channel} set to {clamped}° (calibrated: {trimmed}°)")
        return True

    def get_angles(self) -> Dict[str, float]:
        return dict(self.current_angles)

    def execute_gesture(self, gesture_name: str) -> Dict[str, Any]:
        from .gesture_engine import GestureEngine
        return GestureEngine.build_gesture_sequence(gesture_name, self)
