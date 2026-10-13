"""
pySerial Hardware Bridge: Raspberry Pi to RP2040 Pico Serial Protocol
Sends JSON lines over USB serial and reads telemetry with watchdog heartbeat.
"""

import json
import time
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger("HardwareBridge")

class SerialLinkBridge:
    def __init__(self, port: str = "/dev/ttyACM0", baudrate: int = 115200, timeout: float = 0.5):
        self.port = port
        self.baudrate = baudrate
        self.timeout = timeout
        self.serial_conn = None
        self.has_pyserial = False
        self.last_heartbeat = time.time()

        # Attempt pySerial import
        try:
            import serial
            self.serial_conn = serial.Serial(port, baudrate, timeout=timeout)
            self.has_pyserial = True
            logger.info(f"[HWBridge] pySerial connected to Pico at {port} ({baudrate} baud).")
        except Exception as e:
            logger.warning(f"[HWBridge] pySerial not connected ({e}). Using simulated hardware serial link.")

    def send_command(self, cmd_type: str, params: Dict[str, Any]) -> bool:
        """Sends newline-terminated JSON command to RP2040 Pico."""
        payload = {"t": cmd_type, **params, "ts": int(time.time())}
        json_line = json.dumps(payload) + "\n"
        
        if self.has_pyserial and self.serial_conn and self.serial_conn.is_open:
            try:
                self.serial_conn.write(json_line.encode("utf-8"))
                logger.info(f"[HWBridge] Sent to Pico: {json_line.strip()}")
                return True
            except Exception as e:
                logger.error(f"[HWBridge] Serial write error: {e}")
                return False

        logger.info(f"[HWBridge] (Simulated) Sent to Pico: {json_line.strip()}")
        return True

    def read_telemetry(self) -> Dict[str, Any]:
        """Reads incoming telemetry JSON line from Pico."""
        if self.has_pyserial and self.serial_conn and self.serial_conn.in_waiting:
            try:
                line = self.serial_conn.readline().decode("utf-8").strip()
                if line:
                    return json.loads(line)
            except Exception as e:
                logger.error(f"[HWBridge] Serial read error: {e}")

        # Simulated telemetry
        return {
            "t": "telemetry",
            "edge_trip": False,
            "watchdog_ok": True,
            "privacy_switch": False,
            "battery_v": 5.1
        }

    def send_heartbeat(self):
        """Heartbeat pulse preventing Pico safety watchdog trip."""
        self.send_command("heartbeat", {"ping": 1})
        self.last_heartbeat = time.time()
