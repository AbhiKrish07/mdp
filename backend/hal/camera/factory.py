"""Camera Factory: auto-selects physical OpenCV camera or falls back to Mock."""

import logging
from typing import Optional
from .base import BaseCameraDriver
from .opencv_driver import OpenCVCameraDriver
from .mock_driver import MockCameraDriver

logger = logging.getLogger("CameraFactory")

def get_camera_driver(prefer_hardware: bool = True, device_index: int = 0) -> BaseCameraDriver:
    """Returns an active camera driver, trying physical camera first if requested."""
    if prefer_hardware:
        drv = OpenCVCameraDriver(device_index=device_index)
        if drv.start():
            logger.info("[CameraFactory] Initialized physical camera driver.")
            return drv
        logger.info("[CameraFactory] No physical camera found. Falling back to MockCameraDriver.")

    mock = MockCameraDriver()
    mock.start()
    return mock
