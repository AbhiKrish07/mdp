"""
MQTT Topic Payload Schemas & Data Contracts for AI Desk Companion
"""

from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field
import time

class TranscriptPayload(BaseModel):
    transcript: str
    confidence: float = 1.0
    speaker_id: Optional[str] = None
    timestamp: float = Field(default_factory=time.time)

class VisionRequestPayload(BaseModel):
    request_id: str
    prompt: str = "Analyze this image on my desk"
    resize_max_dim: int = 1024
    timestamp: float = Field(default_factory=time.time)

class VisionResultPayload(BaseModel):
    request_id: str
    success: bool
    summary: str
    error: Optional[str] = None
    timestamp: float = Field(default_factory=time.time)

class AssistantResponsePayload(BaseModel):
    speech: str
    emotion: str = "idle" # idle, listening, thinking, speaking, happy, concerned, privacy_off
    gesture: Optional[str] = None # wave, point, nudge, nod, neutral
    request_id: Optional[str] = None
    timestamp: float = Field(default_factory=time.time)

class AssistantStatePayload(BaseModel):
    state: str # idle, listening, thinking, speaking, happy, concerned, privacy_off
    detail: Optional[str] = None
    timestamp: float = Field(default_factory=time.time)

class HardwareCommandPayload(BaseModel):
    command_id: str
    type: str # 'gesture', 'motor', 'head_tilt', 'privacy_toggle'
    name: Optional[str] = None
    linear_speed: Optional[float] = 0.0
    angular_speed: Optional[float] = 0.0
    servo_angles: Optional[Dict[str, float]] = None
    timestamp: float = Field(default_factory=time.time)

class HardwareTelemetryPayload(BaseModel):
    edge_trip: bool = False
    watchdog_ok: bool = True
    privacy_switch: bool = False
    battery_v: float = 5.0
    sensor_distances_cm: List[float] = Field(default_factory=lambda: [25.0, 25.0, 25.0])
    timestamp: float = Field(default_factory=time.time)

class SystemHealthPayload(BaseModel):
    service_name: str
    status: str # 'ok', 'degraded', 'error'
    cpu_percent: Optional[float] = None
    memory_mb: Optional[float] = None
    error_message: Optional[str] = None
    timestamp: float = Field(default_factory=time.time)
