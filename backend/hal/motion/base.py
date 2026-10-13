"""Abstract Motion Driver interface for mobility, kinematics, and posture control."""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

class BaseMotionDriver(ABC):
    """Abstract base class for robot locomotion (wheeled, legged, or stationary pan-tilt)."""

    @abstractmethod
    def set_velocity(self, linear: float, angular: float) -> Dict[str, Any]:
        """Command continuous movement in normalized range [-1.0, 1.0]."""
        pass

    @abstractmethod
    def execute_posture(self, posture_name: str) -> Dict[str, Any]:
        """Command high-level posture or gait (e.g. 'sit', 'stand', 'walk', 'stretch', 'rest')."""
        pass

    @abstractmethod
    def emergency_stop(self) -> Dict[str, Any]:
        """Immediately cut motor power to 0."""
        pass

    @abstractmethod
    def get_status(self) -> Dict[str, Any]:
        """Return motion telemetry (current speed, active posture, safety cutoff state)."""
        pass
