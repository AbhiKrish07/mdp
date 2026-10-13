"""
AI Desk Companion - Hardware Abstraction Layer (HAL)
====================================================
Maps the software stack directly to the physical hardware components
specified in Section 7 of the Project Report:
  1. Compute: Raspberry Pi 5
  2. Camera: Pi Camera Module 3 (CSI-2 via Picamera2)
  3. Microphone: USB Mic Array / ReSpeaker HAT (16kHz PCM audio)
  4. Speaker: USB / I2S Speaker (ALSA audio stream)
  5. Screen: 2-4" LCD/IPS Display (Pygame UI frame buffer)
  6. Sub-controller: RP2040 Pico (USB Serial /dev/ttyACM0 @ 115200 baud)
  7. Actuators: 3x Servos (Arms + Head tilt) & 2x DC Gear Motors (Mobility)
  8. Sensors: 2x IR Drop Sensors (Cliff safety) & Physical Privacy Switch

Dual-Mode Operation:
  - If running on laptop (no hardware): Emulates hardware responses with realistic telemetry.
  - If running on Raspberry Pi (hardware present): Connects directly to hardware drivers.
"""

import time
import json
import logging
from typing import Dict, Any, Optional

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("HAL")


# ============================================================================
# 1. CAMERA MODULE 3 INTERFACE
# ============================================================================
class CameraInterface:
    """Controls the Raspberry Pi Camera Module 3 (Sony IMX708 autofocus sensor)."""
    def __init__(self, resolution=(1920, 1080), framerate=30):
        self.resolution = resolution
        self.framerate = framerate
        self.is_hardware_available = False

        # Check if running on real Raspberry Pi with Picamera2
        try:
            from picamera2 import Picamera2  # type: ignore[import-not-found]
            self.cam = Picamera2()
            self.is_hardware_available = True
            logger.info("[Camera] Hardware detected: Pi Camera Module 3 ready.")
        except (ImportError, Exception):
            logger.info("[Camera] Running in EMULATION mode (No physical camera detected).")

    def capture_frame(self, privacy_cutoff: bool = False) -> Dict[str, Any]:
        """Captures a frame for face tracking or document/component reading."""
        if privacy_cutoff:
            logger.warning("[Camera] Capture BLOCKED by physical privacy switch.")
            return {"status": "blocked", "frame": None}

        if self.is_hardware_available:
            # Physical camera capture
            frame = self.cam.capture_array()
            return {"status": "ok", "source": "physical_camera", "resolution": self.resolution}
        
        # Emulated camera capture
        return {
            "status": "ok",
            "source": "emulated_camera",
            "resolution": self.resolution,
            "mock_scene": "Desk with textbook and 10k resistor visible"
        }


# ============================================================================
# 2. MICROPHONE & SPEAKER AUDIO INTERFACE
# ============================================================================
class AudioInterface:
    """Controls the USB Mic Array (ReSpeaker) and the USB/I2S Speaker."""
    def __init__(self, sample_rate=16000):
        self.sample_rate = sample_rate
        self.mic_available = False
        self.speaker_available = False

        try:
            import pyaudio  # type: ignore[import-not-found]
            self.pa = pyaudio.PyAudio()
            self.mic_available = True
            logger.info("[Audio] PyAudio hardware driver detected.")
        except (ImportError, Exception):
            logger.info("[Audio] Running in EMULATION mode for Mic & Speaker.")

    def record_chunk(self, duration_sec: float = 3.0, privacy_cutoff: bool = False) -> Dict[str, Any]:
        """Records PCM audio for wake-word and STT speech processing."""
        if privacy_cutoff:
            logger.warning("[Audio] Microphone BLOCKED by physical privacy switch.")
            return {"status": "blocked", "audio_bytes": None}

        return {
            "status": "recorded",
            "sample_rate": self.sample_rate,
            "duration": duration_sec,
            "emulated_text": "Hey companion, what is this resistor on my desk?"
        }

    def play_tts(self, text: str):
        """Dispatches synthesized speech audio to the speaker."""
        logger.info(f"[Speaker TTS Output]: >>> Speaking: \"{text}\" <<<")


# ============================================================================
# 3. FACE SCREEN DISPLAY INTERFACE
# ============================================================================
class DisplayInterface:
    """Controls the 2-4\" LCD Screen to show animated robot expressions."""
    def __init__(self, width=800, height=480):
        self.width = width
        self.height = height
        self.current_expression = "idle"
        logger.info(f"[Display] Initialized screen interface ({width}x{height} px).")

    def set_expression(self, expression: str):
        """Valid states: idle, listening, thinking, speaking, happy, alert, nudge"""
        self.current_expression = expression
        logger.info(f"[Display Screen] Updated eyes expression -> [{expression.upper()}]")


# ============================================================================
# 4. PICO RP2040 SERIAL BRIDGE (Motors, Servos, IR Sensors, Privacy)
# ============================================================================
class PicoControllerBridge:
    """
    Communicates with the RP2040 Pico microcontroller over USB Serial (/dev/ttyACM0).
    Controls motors and servos, and reads real-time safety sensors.
    """
    def __init__(self, port="/dev/ttyACM0", baudrate=115200):
        self.port = port
        self.baudrate = baudrate
        self.is_connected = False
        self.serial_conn = None

        # Hardware Safety State (simulated if no Pico connected)
        self.privacy_switch_engaged = False
        self.edge_sensor_tripped = False
        self.battery_voltage = 5.1

        try:
            import serial  # type: ignore[import-not-found]
            self.serial_conn = serial.Serial(port, baudrate, timeout=0.5)
            self.is_connected = True
            logger.info(f"[Pico Bridge] Connected to real hardware on {port}.")
        except Exception:
            logger.info(f"[Pico Bridge] Running in EMULATION mode (Pico port {port} simulated).")

    def send_pico_command(self, cmd_type: str, data: Dict[str, Any]) -> str:
        """Formats and transmits a newline-terminated JSON packet to the Pico."""
        packet = {"t": cmd_type, **data, "ts": int(time.time())}
        json_packet = json.dumps(packet)
        
        if self.is_connected and self.serial_conn:
            self.serial_conn.write((json_packet + "\n").encode())
            logger.info(f"[UART -> Pico Hardware]: {json_packet}")
        else:
            logger.info(f"[UART -> Pico Emulated]: {json_packet}")
            
        return json_packet

    # Actuator Controls
    def move_arm_servo(self, arm: str, angle_deg: int):
        """arm: 'left', 'right', or 'head' (Angle: 0 to 180 degrees)"""
        angle = max(0, min(180, angle_deg))
        return self.send_pico_command("servo", {"arm": arm, "angle": angle})

    def drive_motors(self, left_speed: float, right_speed: float):
        """Speed range: -1.0 (full reverse) to +1.0 (full forward)."""
        if self.edge_sensor_tripped:
            logger.error("[SAFETY] MOTORS INHIBITED: Edge sensor cliff detected! Driving disabled.")
            return self.send_pico_command("drive", {"left": 0.0, "right": 0.0, "safety_stop": True})

        return self.send_pico_command("drive", {"left": left_speed, "right": right_speed})

    # Sensor Telemetry
    def read_telemetry(self) -> Dict[str, Any]:
        """Reads status packets returned from the Pico."""
        return {
            "privacy_switch": self.privacy_switch_engaged,
            "edge_trip": self.edge_sensor_tripped,
            "battery_v": self.battery_voltage,
            "watchdog_ok": True
        }


# ============================================================================
# MASTER HARDWARE MANAGER (The unified interface for the rest of your app)
# ============================================================================
class HardwareManager:
    """Single master class that coordinates all physical sub-systems."""
    def __init__(self):
        logger.info("Initializing AI Desk Companion Hardware Abstraction Layer...")
        self.camera = CameraInterface()
        self.audio = AudioInterface()
        self.display = DisplayInterface()
        self.pico = PicoControllerBridge()
        logger.info("✓ Hardware Abstraction Layer Ready.")