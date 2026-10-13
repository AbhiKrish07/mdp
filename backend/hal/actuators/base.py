"""Abstract Actuator interface for multi-channel servo and motor articulation."""

from abc import ABC, abstractmethod
from typing import Dict, Any, List

class BaseActuatorDriver(ABC):
    """Abstract base class for servo and joint actuators."""

    @abstractmethod
    def set_angle(self, channel: str, angle: float) -> bool:
        """Set joint target angle in degrees."""
        pass

    @abstractmethod
    def get_angles(self) -> Dict[str, float]:
        """Get current angles for all configured joints."""
        pass

    @abstractmethod
    def execute_gesture(self, gesture_name: str) -> Dict[str, Any]:
        """Execute a named coordinated gesture."""
        pass
