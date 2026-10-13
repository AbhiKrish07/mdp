"""High-level expressive gesture engine for arms and head."""

import time
from typing import Dict, Any, List

class GestureEngine:
    """Coordinates expressive physical gestures across multiple servo channels."""

    @staticmethod
    def build_gesture_sequence(gesture_name: str, controller=None) -> Dict[str, Any]:
        g = (gesture_name or "neutral").lower()

        commands: List[Dict[str, Any]] = []

        if g == "wave":
            commands = [
                {"channel": "right_arm", "angle": 140, "duration": 0.3},
                {"channel": "right_arm", "angle": 70, "duration": 0.3},
                {"channel": "right_arm", "angle": 140, "duration": 0.3},
                {"channel": "right_arm", "angle": 90, "duration": 0.3},
            ]
        elif g == "point":
            commands = [
                {"channel": "left_arm", "angle": 150, "duration": 0.4},
                {"channel": "head_tilt", "angle": 115, "duration": 0.3},
            ]
        elif g == "nudge":
            commands = [
                {"channel": "left_arm", "angle": 110, "duration": 0.25},
                {"channel": "left_arm", "angle": 90, "duration": 0.25},
            ]
        elif g == "nod":
            commands = [
                {"channel": "head_tilt", "angle": 75, "duration": 0.2},
                {"channel": "head_tilt", "angle": 105, "duration": 0.2},
                {"channel": "head_tilt", "angle": 90, "duration": 0.2},
            ]
        elif g == "stretch":
            commands = [
                {"channel": "left_arm", "angle": 160, "duration": 0.5},
                {"channel": "right_arm", "angle": 160, "duration": 0.5},
                {"channel": "head_tilt", "angle": 120, "duration": 0.5},
            ]
        else:
            g = "neutral"
            commands = [
                {"channel": "left_arm", "angle": 90, "duration": 0.2},
                {"channel": "right_arm", "angle": 90, "duration": 0.2},
                {"channel": "head_tilt", "angle": 90, "duration": 0.2},
            ]

        # Apply final angles to controller if provided
        if controller:
            for step in commands:
                controller.set_angle(step["channel"], step["angle"])

        return {
            "gesture": g,
            "servo_commands": commands,
            "timestamp": time.time(),
        }
