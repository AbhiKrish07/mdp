"""Synthetic Camera Driver for simulation, headless servers, and hardware-free testing."""

import time
import base64
from typing import Dict, Any
from .base import BaseCameraDriver

class MockCameraDriver(BaseCameraDriver):
    """Generates synthetic camera frames and sample desk images without hardware."""

    # 1x1 neutral transparent/gray PNG placeholder in base64
    SAMPLE_CIRCUIT_IMAGE = (
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
    )

    def __init__(self, scene_description: str = "10k Ohm Resistor and Handwritten Circuit Note on desk"):
        self.scene_description = scene_description
        self._running = False
        self._frame_count = 0

    def start(self) -> bool:
        self._running = True
        return True

    def stop(self) -> None:
        self._running = False

    def is_available(self) -> bool:
        return self._running

    def get_frame(self) -> Dict[str, Any]:
        self._frame_count += 1
        return {
            "status": "simulated",
            "frame_id": self._frame_count,
            "resolution": (640, 480),
            "face_estimate": {"x": 0.5, "y": 0.45, "confidence": 0.92},
            "timestamp": time.time(),
        }

    def capture_still(self, max_dim: int = 1024) -> Dict[str, Any]:
        return {
            "status": "simulated",
            "image_base64": self.SAMPLE_CIRCUIT_IMAGE,
            "description": self.scene_description,
            "dimensions": (640, 480),
            "timestamp": time.time(),
        }
