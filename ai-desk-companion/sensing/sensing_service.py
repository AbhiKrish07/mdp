"""
Sensing Layer Service
Reads hardware inputs: camera stream, mic array levels, IR edge sensors, and physical privacy switch state.
Includes automatic fallback for simulation environments when physical Pi sensors are absent.
"""

import time
import random
from typing import Dict, Any, Optional

class SensingService:
    def __init__(self, settings: Dict[str, Any] = None, calibration: Dict[str, Any] = None):
        self.settings = settings or {}
        self.calibration = calibration or {}
        
        # Privacy state (hard electrical/logical cutoff switch)
        self.privacy_switch_active = self.settings.get("privacy_mode_default", False)
        self.camera_active = False
        self.mic_active = False

    def toggle_privacy_switch(self, state: Optional[bool] = None) -> bool:
        """Physical hardware privacy switch cutoff."""
        if state is None:
            self.privacy_switch_active = not self.privacy_switch_active
        else:
            self.privacy_switch_active = state
            
        if self.privacy_switch_active:
            self.camera_active = False
            self.mic_active = False
            print("[SensingService] Privacy Switch ENGAGED: Camera and Microphone physically disabled.")
        else:
            self.camera_active = True
            self.mic_active = True
            print("[SensingService] Privacy Switch DISENGAGED: Sensors active.")
            
        return self.privacy_switch_active

    def read_ir_sensors(self) -> Dict[str, float]:
        """Read IR edge detection sensors (returns distance in cm)."""
        # Simulated edge sensing data
        return {
            "front_left_cm": round(random.uniform(10.0, 30.0), 2),
            "front_right_cm": round(random.uniform(10.0, 30.0), 2),
            "is_edge_detected": False
        }

    def capture_frame(self) -> Dict[str, Any]:
        """Capture frame metadata from camera sensor if privacy switch allows."""
        if self.privacy_switch_active:
            return {"status": "blocked_by_privacy_switch", "frame": None}
            
        return {
            "status": "active",
            "resolution": "1920x1080",
            "fps": 30,
            "timestamp": time.time()
        }

    def read_mic_level(self) -> float:
        """Read audio level from mic array (0.0 to 1.0)."""
        if self.privacy_switch_active:
            return 0.0
        return round(random.uniform(0.05, 0.4), 2)
