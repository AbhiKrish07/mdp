"""Cross-platform OpenCV Camera Driver.
Works with any standard USB webcam, laptop camera, CSI camera via V4L2/gstreamer, or RTSP stream.
Replaces proprietary picamera2 with hardware-neutral video capture.
"""

import time
import base64
import logging
from typing import Dict, Any, Optional, Tuple
from .base import BaseCameraDriver

logger = logging.getLogger("OpenCVCameraDriver")

class OpenCVCameraDriver(BaseCameraDriver):
    def __init__(self, device_index: int = 0, resolution: Tuple[int, int] = (1920, 1080)):
        self.device_index = device_index
        self.resolution = resolution
        self.cap = None
        self.has_cv2 = False
        self._running = False

        try:
            import cv2
            self.cv2 = cv2
            self.has_cv2 = True
        except ImportError:
            logger.warning("[OpenCVCameraDriver] opencv-python not installed.")

    def start(self) -> bool:
        if not self.has_cv2:
            return False
        try:
            self.cap = self.cv2.VideoCapture(self.device_index)
            if self.cap.isOpened():
                self.cap.set(self.cv2.CAP_PROP_FRAME_WIDTH, self.resolution[0])
                self.cap.set(self.cv2.CAP_PROP_FRAME_HEIGHT, self.resolution[1])
                self._running = True
                logger.info(f"[OpenCVCameraDriver] Camera opened at index {self.device_index}")
                return True
            logger.warning(f"[OpenCVCameraDriver] Failed to open camera device index {self.device_index}")
            return False
        except Exception as e:
            logger.error(f"[OpenCVCameraDriver] Error starting camera: {e}")
            return False

    def stop(self) -> None:
        self._running = False
        if self.cap:
            try:
                self.cap.release()
            except Exception:
                pass
            self.cap = None

    def is_available(self) -> bool:
        return self._running and self.cap is not None and self.cap.isOpened()

    def get_frame(self) -> Dict[str, Any]:
        if not self.is_available():
            return {"status": "unavailable", "frame": None, "timestamp": time.time()}
        try:
            ret, frame = self.cap.read()
            if not ret or frame is None:
                return {"status": "read_error", "frame": None, "timestamp": time.time()}
            # Downsample for lightweight tracking
            small = self.cv2.resize(frame, (320, 240))
            return {"status": "ok", "frame": small, "timestamp": time.time()}
        except Exception as e:
            logger.error(f"[OpenCVCameraDriver] Frame capture error: {e}")
            return {"status": "error", "error": str(e), "timestamp": time.time()}

    def capture_still(self, max_dim: int = 1024) -> Dict[str, Any]:
        if not self.is_available():
            return {"status": "unavailable", "image_base64": None, "timestamp": time.time()}
        try:
            ret, frame = self.cap.read()
            if not ret or frame is None:
                return {"status": "read_error", "image_base64": None, "timestamp": time.time()}
            h, w = frame.shape[:2]
            scale = min(1.0, max_dim / max(h, w))
            if scale < 1.0:
                frame = self.cv2.resize(frame, (int(w * scale), int(h * scale)))
            ret, buf = self.cv2.imencode(".jpg", frame, [int(self.cv2.IMWRITE_JPEG_QUALITY), 85])
            b64_str = base64.b64encode(buf).decode("utf-8") if ret else ""
            return {
                "status": "ok",
                "image_base64": f"data:image/jpeg;base64,{b64_str}",
                "dimensions": (frame.shape[1], frame.shape[0]),
                "timestamp": time.time(),
            }
        except Exception as e:
            logger.error(f"[OpenCVCameraDriver] Still capture error: {e}")
            return {"status": "error", "error": str(e), "timestamp": time.time()}
