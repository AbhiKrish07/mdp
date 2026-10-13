"""Desk Edge & Cliff Safety Guard.
Monitors IR, ultrasonic, or ToF downward-facing distance sensors.
Trips emergency motor cutoff if distance indicates the desk edge has been breached.
"""

import time
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger("EdgeGuard")

class EdgeGuard:
    """Monitors floor/table distance and enforces emergency cutoff."""

    def __init__(self, threshold_cm: float = 4.0):
        self.threshold_cm = threshold_cm
        self.safety_tripped = False
        self.last_trip_time = 0.0

    def evaluate(self, sensor_readings: Dict[str, float]) -> bool:
        """Evaluates sensor readings.
        sensor_readings: dict like {"front_left_cm": 2.5, "front_right_cm": 3.0}
        Returns True if SAFE, False if EDGE TRIPPED.
        """
        for sensor_id, dist_cm in sensor_readings.items():
            # If distance exceeds threshold (table dropped away) or is too close to edge
            if dist_cm < self.threshold_cm or dist_cm > 25.0:
                self.safety_tripped = True
                self.last_trip_time = time.time()
                logger.warning(f"[EdgeGuard] CLIFF/EDGE DETECTED on {sensor_id}: {dist_cm:.1f}cm! Cutoff engaged.")
                return False

        self.safety_tripped = False
        return True

    def is_safe(self) -> bool:
        return not self.safety_tripped

    def reset(self) -> None:
        self.safety_tripped = False
