"""Abstract Transport Driver interface for microcontroller communication."""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

class BaseTransport(ABC):
    """Abstract base class for host-to-microcontroller communication bridges."""

    @abstractmethod
    def connect(self) -> bool:
        """Establish connection to the hardware device."""
        pass

    @abstractmethod
    def disconnect(self) -> None:
        """Close connection and release transport resources."""
        pass

    @abstractmethod
    def is_connected(self) -> bool:
        """Check if link is currently alive and responsive."""
        pass

    @abstractmethod
    def send_command(self, cmd_type: str, params: Dict[str, Any]) -> bool:
        """Send formatted command packet to microcontroller."""
        pass

    @abstractmethod
    def read_telemetry(self) -> Dict[str, Any]:
        """Poll incoming telemetry packet from microcontroller."""
        pass

    @abstractmethod
    def send_heartbeat(self) -> bool:
        """Send watchdog heartbeat ping."""
        pass
