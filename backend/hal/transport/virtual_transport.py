"""Virtual Microcontroller Transport.
Simulates embedded firmware behavior (Pico, ESP32, Arduino) in memory.
Includes safety watchdog timer, edge trip simulation, and battery telemetry.
Allows 100% headless testing without physical microcontroller hardware.
"""

import time
import logging
from typing import Dict, Any
from .base import BaseTransport

logger = logging.getLogger("VirtualTransport")

class VirtualTransport(BaseTransport):
    """Firmware simulator emulating serial communication, watchdog, and sensor inputs."""

    def __init__(self, watchdog_timeout_sec: float = 2.0):
        self.watchdog_timeout_sec = watchdog_timeout_sec
        self.connected = True
        self.last_heartbeat = time.time()
        self.edge_trip = False
        self.privacy_switch = False
        self.battery_v = 5.1
        self.last_commands: list = []

    def connect(self) -> bool:
        self.connected = True
        self.last_heartbeat = time.time()
        logger.info("[VirtualTransport] Virtual microcontroller connected.")
        return True

    def disconnect(self) -> None:
        self.connected = False
        logger.info("[VirtualTransport] Virtual microcontroller disconnected.")

    def is_connected(self) -> bool:
        return self.connected

    def send_command(self, cmd_type: str, params: Dict[str, Any]) -> bool:
        if not self.connected:
            return False

        now = time.time()
        self.last_commands.append({"type": cmd_type, "params": params, "ts": now})
        if len(self.last_commands) > 50:
            self.last_commands.pop(0)

        if cmd_type == "heartbeat":
            self.last_heartbeat = now
            return True
        elif cmd_type == "gesture":
            logger.debug(f"[VirtualTransport] Virtual servo gesture: {params.get('name')}")
            return True
        elif cmd_type == "motor":
            logger.debug(f"[VirtualTransport] Virtual motor velocity: {params.get('speed')}")
            return True

        return True

    def read_telemetry(self) -> Dict[str, Any]:
        now = time.time()
        watchdog_ok = (now - self.last_heartbeat) <= self.watchdog_timeout_sec

        return {
            "t": "telemetry",
            "edge_trip": self.edge_trip,
            "watchdog_ok": watchdog_ok,
            "privacy_switch": self.privacy_switch,
            "battery_v": self.battery_v,
            "timestamp": now,
        }

    def send_heartbeat(self) -> bool:
        return self.send_command("heartbeat", {"ping": 1})

    def simulate_edge_trip(self, state: bool) -> None:
        """Test hook: simulate approaching desk boundary."""
        self.edge_trip = state

    def simulate_privacy_switch(self, state: bool) -> None:
        """Test hook: simulate physical toggle switch."""
        self.privacy_switch = state
