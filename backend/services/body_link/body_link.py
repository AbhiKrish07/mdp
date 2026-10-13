"""
BodyLink Service: Inter-module communication between Head (Raspberry Pi 5)
and Robot Body (ESP32/RP2040 MCU) over USB-C Serial Link.
"""

import json
import time
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger("BodyLink")

class BodyLink:
    """
    Manages transport, packet framing, and heartbeat watchdog with the robot body.
    Supports real pySerial connection and simulated dual-mode fallback.
    """
    def __init__(self, port: str = "/dev/ttyACM0", baudrate: int = 115200, timeout: float = 0.5):
        self.port = port
        self.baudrate = baudrate
        self.timeout = timeout
        self.serial_conn = None
        self.has_pyserial = False
        self.seq_num = 0
        self.last_heartbeat = time.time()
        self.last_rx_time = time.time()
        self.connected = False
        self.watchdog_timeout_ms = 500

        # Simulated state
        self._sim_body_battery = 88.5  # percentage
        self._sim_battery_v = 7.4     # 2S LiPo nominal voltage
        self._sim_left_cliff = False
        self._sim_center_cliff = False
        self._sim_right_cliff = False
        self._sim_last_command = "NONE"
        self._sim_motor_moving = False

        self._init_connection()

    def _init_connection(self):
        try:
            import serial
            self.serial_conn = serial.Serial(self.port, self.baudrate, timeout=self.timeout)
            self.has_pyserial = True
            self.connected = True
            logger.info(f"[BodyLink] Hardware serial link connected on {self.port} at {self.baudrate} baud.")
        except Exception as e:
            self.connected = True  # In simulation mode, we consider link ready
            logger.info(f"[BodyLink] Operating in simulated USB-C BodyLink mode: {e}")

    def send_command(self, action: str, params: Optional[Dict[str, Any]] = None, timeout_ms: int = 1000) -> Dict[str, Any]:
        """
        Sends a bounded command to the body controller.
        Action must be one of: MOVE_FORWARD, MOVE_BACKWARD, TURN_LEFT, TURN_RIGHT, STOP, WAVE, POINT, NUDGE.
        """
        self.seq_num += 1
        payload = {
            "seq": self.seq_num,
            "action": action,
            "params": params or {},
            "timeout_ms": timeout_ms,
            "timestamp": time.time()
        }

        # Check cliff safety before movement commands
        if action in ["MOVE_FORWARD", "MOVE_BACKWARD", "TURN_LEFT", "TURN_RIGHT"]:
            if self._sim_left_cliff or self._sim_center_cliff or self._sim_right_cliff:
                return {
                    "status": "rejected",
                    "reason": "CLIFF_SENSOR_SAFETY_TRIP",
                    "seq": self.seq_num,
                    "action": action
                }

        packet = json.dumps(payload) + "\n"

        if self.has_pyserial and self.serial_conn and self.serial_conn.is_open:
            try:
                self.serial_conn.write(packet.encode("utf-8"))
                return {"status": "dispatched", "seq": self.seq_num, "action": action, "transport": "pyserial"}
            except Exception as e:
                logger.error(f"[BodyLink] Write failed: {e}")
                return {"status": "error", "message": str(e), "seq": self.seq_num}

        # Emulated response
        self._sim_last_command = action
        self._sim_motor_moving = action in ["MOVE_FORWARD", "MOVE_BACKWARD", "TURN_LEFT", "TURN_RIGHT"]
        return {
            "status": "dispatched",
            "seq": self.seq_num,
            "action": action,
            "transport": "simulated_usb_c",
            "params": params or {}
        }

    def emergency_stop(self) -> Dict[str, Any]:
        """High-priority motor cutoff, bypassing command queues."""
        self._sim_motor_moving = False
        return self.send_command("STOP", {"immediate": True}, timeout_ms=50)

    def ping_heartbeat(self) -> Dict[str, Any]:
        """Heartbeat packet ensuring body firmware doesn't trip watchdog."""
        self.last_heartbeat = time.time()
        return self.send_command("HEARTBEAT", {"client_time": self.last_heartbeat}, timeout_ms=200)

    def read_telemetry(self) -> Dict[str, Any]:
        """Reads real or simulated telemetry from body controller."""
        if self.has_pyserial and self.serial_conn and self.serial_conn.in_waiting:
            try:
                line = self.serial_conn.readline().decode("utf-8").strip()
                if line:
                    data = json.loads(line)
                    self.last_rx_time = time.time()
                    return data
            except Exception as e:
                logger.error(f"[BodyLink] Read error: {e}")

        # Simulated telemetry packet
        now = time.time()
        elapsed_since_hb = (now - self.last_heartbeat) * 1000
        watchdog_healthy = elapsed_since_hb <= self.watchdog_timeout_ms

        return {
            "type": "body_telemetry",
            "connected": self.connected,
            "dock_hall_sensor": True,
            "body_battery_pct": round(self._sim_body_battery, 1),
            "body_battery_v": round(self._sim_battery_v, 2),
            "watchdog_ok": watchdog_healthy,
            "watchdog_elapsed_ms": int(elapsed_since_hb),
            "cliff_sensors": {
                "left": self._sim_left_cliff,
                "center": self._sim_center_cliff,
                "right": self._sim_right_cliff
            },
            "last_command": self._sim_last_command,
            "motors_active": self._sim_motor_moving,
            "firmware_version": "v1.2-esp32-modular",
            "timestamp": now
        }

    def set_cliff_sensor(self, sensor: str, tripped: bool):
        """Allows testing/simulating edge detection."""
        if sensor == "left":
            self._sim_left_cliff = tripped
        elif sensor == "center":
            self._sim_center_cliff = tripped
        elif sensor == "right":
            self._sim_right_cliff = tripped
        if tripped and self._sim_motor_moving:
            self.emergency_stop()
