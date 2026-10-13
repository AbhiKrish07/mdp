"""TCP Socket Hardware Bridge.
Connects over Wi-Fi/Ethernet to wireless microcontrollers (ESP32, Raspberry Pi Zero W, etc.).
"""

import json
import socket
import time
import logging
from typing import Dict, Any, Optional
from .base import BaseTransport

logger = logging.getLogger("TCPTransport")

class TCPTransport(BaseTransport):
    """Network socket transport for wireless embedded controllers."""

    def __init__(self, host: str = "192.168.4.1", port: int = 8888, timeout: float = 1.0):
        self.host = host
        self.port = port
        self.timeout = timeout
        self.sock: Optional[socket.socket] = None

    def connect(self) -> bool:
        try:
            self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.sock.settimeout(self.timeout)
            self.sock.connect((self.host, self.port))
            logger.info(f"[TCPTransport] Connected to {self.host}:{self.port}")
            return True
        except Exception as e:
            logger.debug(f"[TCPTransport] Connection to {self.host}:{self.port} failed: {e}")
            self.sock = None
            return False

    def disconnect(self) -> None:
        if self.sock:
            try:
                self.sock.close()
            except Exception:
                pass
            self.sock = None

    def is_connected(self) -> bool:
        return self.sock is not None

    def send_command(self, cmd_type: str, params: Dict[str, Any]) -> bool:
        if not self.is_connected():
            return False
        payload = {"t": cmd_type, **params, "ts": int(time.time())}
        line = json.dumps(payload) + "\n"
        try:
            self.sock.sendall(line.encode("utf-8"))
            return True
        except Exception as e:
            logger.error(f"[TCPTransport] Socket send error: {e}")
            self.disconnect()
            return False

    def read_telemetry(self) -> Dict[str, Any]:
        if not self.is_connected():
            return {"t": "telemetry", "edge_trip": False, "watchdog_ok": False, "battery_v": 0.0}
        try:
            raw = self.sock.recv(1024).decode("utf-8").strip()
            if raw and raw.startswith("{"):
                return json.loads(raw)
        except Exception:
            pass
        return {"t": "telemetry", "edge_trip": False, "watchdog_ok": True, "battery_v": 5.0}

    def send_heartbeat(self) -> bool:
        return self.send_command("heartbeat", {"ping": 1})
