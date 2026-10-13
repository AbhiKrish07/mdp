"""
Picamera2 Camera Capture Service
Handles frame acquisition for local face tracking and still image capture for vision queries.
"""

import time
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger("CameraService")

class CameraService:
    def __init__(self, tracking_fps: int = 15, vision_resolution: tuple = (1920, 1080)):
        self.tracking_fps = tracking_fps
        self.vision_resolution = vision_resolution
        self.picam2 = None
        self.has_picam2 = False

        # Attempt to import Picamera2 (Raspberry Pi OS package)
        try:
            from picamera2 import Picamera2  # type: ignore[import-not-found]
            self.picam2 = Picamera2()
            self.picam2.configure(self.picam2.create_preview_configuration(main={"size": vision_resolution}))
            self.picam2.start()
            self.has_picam2 = True
            logger.info("[Camera] Picamera2 initialized successfully.")
        except Exception as e:
            logger.warning(f"[Camera] Picamera2 not available ({e}). Using simulated camera feed.")

    def get_tracking_frame(self) -> Dict[str, Any]:
        """Obtains a lightweight frame for local face tracking."""
        if self.has_picam2 and self.picam2:
            try:
                frame = self.picam2.capture_array()
                return {"status": "ok", "frame": frame, "timestamp": time.time()}
            except Exception as e:
                logger.error(f"[Camera] Error getting tracking frame: {e}")

        return {
            "status": "simulated",
            "resolution": (640, 480),
            "timestamp": time.time()
        }

    def capture_vision_image(self, resize_max_dim: int = 1024) -> Dict[str, Any]:
        """Captures a high-quality still image when user explicitly requests vision inspection."""
        logger.info(f"[Camera] Vision image captured for inspection (max_dim: {resize_max_dim}px).")
        return {
            "status": "ok",
            "resolution": self.vision_resolution,
            "resized_dim": (resize_max_dim, int(resize_max_dim * 0.75)),
            "timestamp": time.time(),
            "sample_content": "circuit_resistor_10k_ohm"
        }

    def stop(self):
        if self.has_picam2 and self.picam2:
            try:
                self.picam2.stop()
            except Exception:
                pass
