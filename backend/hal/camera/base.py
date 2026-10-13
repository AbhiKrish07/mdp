"""Abstract Camera Driver interface for physical and simulated vision perception."""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, Tuple

class BaseCameraDriver(ABC):
    """Abstract base class for camera capture drivers."""

    @abstractmethod
    def start(self) -> bool:
        """Start the camera stream."""
        pass

    @abstractmethod
    def stop(self) -> None:
        """Stop the camera stream and release hardware."""
        pass

    @abstractmethod
    def get_frame(self) -> Dict[str, Any]:
        """Capture a lightweight frame for real-time tracking (e.g. face/gaze/motion)."""
        pass

    @abstractmethod
    def capture_still(self, max_dim: int = 1024) -> Dict[str, Any]:
        """Capture a high-resolution still image for multimodal LLM vision queries."""
        pass

    @abstractmethod
    def is_available(self) -> bool:
        """Check if camera hardware is present and functional."""
        pass
