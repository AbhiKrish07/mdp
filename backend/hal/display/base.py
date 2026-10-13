"""Abstract Display Driver for robot eye animations and UI states."""

from abc import ABC, abstractmethod
from typing import Dict, Any

class BaseDisplayDriver(ABC):
    """Abstract base class for robot face expression display."""

    VALID_STATES = ["idle", "listening", "thinking", "speaking", "happy", "alert", "nudge", "privacy_off"]

    @abstractmethod
    def set_state(self, state: str) -> str:
        """Update active facial expression state."""
        pass

    @abstractmethod
    def get_state(self) -> str:
        """Get current facial expression state."""
        pass

    @abstractmethod
    def render_frame(self) -> Dict[str, Any]:
        """Render or tick one animation frame."""
        pass
