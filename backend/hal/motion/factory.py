"""Motion Factory: instantiates appropriate mobility driver (wheels, quadruped, or mock)."""

from typing import Optional
from .base import BaseMotionDriver
from .differential_drive import DifferentialDriveDriver
from .quadruped_gait import QuadrupedGaitDriver

def get_motion_driver(chassis_type: str = "wheels") -> BaseMotionDriver:
    """Factory selecting mobility driver based on physical hardware configuration."""
    chassis = chassis_type.lower()
    if "quad" in chassis or "leg" in chassis:
        return QuadrupedGaitDriver()
    return DifferentialDriveDriver()
