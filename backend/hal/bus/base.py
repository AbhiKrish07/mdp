"""Abstract Event Bus interface and topic registry for hardware-agnostic IPC."""

from abc import ABC, abstractmethod
from typing import Callable, Dict, Any, List

TOPICS = {
    "TRANSCRIPT": "robot/audio/transcript",
    "VISION_REQ": "robot/vision/request",
    "VISION_RES": "robot/vision/result",
    "RESPONSE": "robot/assistant/response",
    "STATE": "robot/assistant/state",
    "HW_CMD": "robot/hardware/command",
    "HW_TELEMETRY": "robot/hardware/telemetry",
    "HEALTH": "robot/system/health",
    "SAFETY_ALERT": "robot/safety/alert",
}

class BaseEventBus(ABC):
    """Abstract base class for all messaging buses (In-Memory, MQTT, WebSockets, etc.)."""

    @abstractmethod
    def connect(self) -> None:
        """Initialize and connect to the underlying transport/broker."""
        pass

    @abstractmethod
    def disconnect(self) -> None:
        """Disconnect and release resources."""
        pass

    @abstractmethod
    def subscribe(self, topic: str, callback: Callable[[Dict[str, Any]], None]) -> None:
        """Register a subscriber callback for a topic."""
        pass

    @abstractmethod
    def unsubscribe(self, topic: str, callback: Callable[[Dict[str, Any]], None]) -> None:
        """Remove a subscriber callback."""
        pass

    @abstractmethod
    def publish(self, topic: str, payload: Dict[str, Any]) -> None:
        """Publish a message payload to a topic."""
        pass
