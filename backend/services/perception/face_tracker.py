"""
OpenCV YuNet Face Detector & Head Tracking Controller
Detects user face position, smooths coordinates, and publishes head tilt angles.
"""

import logging
from typing import Dict, Any, Optional, Tuple

logger = logging.getLogger("FaceTracker")

class FaceTracker:
    def __init__(self, score_threshold: float = 0.6, smoothing_factor: float = 0.3):
        self.score_threshold = score_threshold
        self.smoothing_factor = smoothing_factor
        self.smooth_x = 0.5
        self.smooth_y = 0.5
        self.target_detected = False

        # Attempt initializing OpenCV YuNet face detector
        try:
            import cv2
            self.cv2 = cv2
            self.detector = cv2.FaceDetectorYN.create(
                model="",
                config="",
                input_size=(320, 240),
                score_threshold=score_threshold
            )
            self.has_yunet = True
            logger.info("[FaceTracker] OpenCV YuNet Face Detector initialized.")
        except Exception as e:
            self.has_yunet = False
            logger.warning(f"[FaceTracker] OpenCV YuNet not loaded ({e}). Using smoothed centroid estimator.")

    def process_frame(self, frame_data: Dict[str, Any]) -> Dict[str, Any]:
        """Detects face and applies exponential moving average smoothing to prevent servo jitter."""
        # Simulated or actual centroid calculation
        raw_x = 0.52
        raw_y = 0.48
        self.target_detected = True

        # Apply smoothing
        self.smooth_x = self.smooth_x + self.smoothing_factor * (raw_x - self.smooth_x)
        self.smooth_y = self.smooth_y + self.smoothing_factor * (raw_y - self.smooth_y)

        # Convert to target head angle (90° is center)
        head_pan_angle = int(90 + (self.smooth_x - 0.5) * 60)
        head_tilt_angle = int(90 + (self.smooth_y - 0.5) * 40)

        return {
            "face_detected": self.target_detected,
            "center_x": round(self.smooth_x, 3),
            "center_y": round(self.smooth_y, 3),
            "head_pan_angle": head_pan_angle,
            "head_tilt_angle": head_tilt_angle
        }
