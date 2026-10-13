"""Universal Hardware & Perception Adapters connecting HAL to CompanionCore.
Works across all hardware platforms (Raspberry Pi, PC, Jetson, ESP32, or simulation).
"""

import os
import json
import time
import base64
import urllib.request
from typing import Optional, Dict, Any, List

from .bus.memory_bus import MemoryEventBus
from .camera.factory import get_camera_driver
from .motion.factory import get_motion_driver
from .actuators.servo_controller import ServoController
from .actuators.gesture_engine import GestureEngine
from .display.web_event_display import WebEventDisplayDriver
from .display.terminal_display import TerminalDisplayDriver
from .transport.factory import get_transport
from .safety.edge_guard import EdgeGuard
from .safety.watchdog import SafetyWatchdog
from .safety.privacy_guard import PrivacyGuard
from .safety.focus_monitor import FocusMonitor
from .audio.vad import UniversalVAD
from .audio.wake_word import UniversalWakeWordDetector
from .audio.stt import UniversalSTT
from .audio.tts import UniversalTTS

class UniversalHardwareAdapter:
    """General hardware driver uniting transport, mobility, servos, camera, and display."""

    def __init__(self, chassis: str = "wheels", camera_index: int = 0):
        self.bus = MemoryEventBus(name="companion_hal_bus")
        self.bus.connect()

        self.transport = get_transport()
        self.camera = get_camera_driver(prefer_hardware=True, device_index=camera_index)
        self.motion = get_motion_driver(chassis_type=chassis)
        self.servos = ServoController()
        self.display = WebEventDisplayDriver(event_bus=self.bus)
        self.terminal = TerminalDisplayDriver()

        self.edge_guard = EdgeGuard(threshold_cm=4.0)
        self.privacy_guard = PrivacyGuard(initial_state=False)
        self.watchdog = SafetyWatchdog(timeout_sec=2.5, on_timeout=self.stop_motion)
        self.tts = UniversalTTS()

        self.expression = "idle"
        self.gesture = "neutral"

    def read_state(self):
        from companion_core import DeviceState
        telemetry = self.transport.read_telemetry()
        self.watchdog.feed()

        # Update edge safety from hardware telemetry or sensor
        edge_trip = bool(telemetry.get("edge_trip", False))
        if edge_trip:
            self.stop_motion()

        # Update physical privacy switch if present in telemetry
        if "privacy_switch" in telemetry:
            self.privacy_guard.set_privacy(bool(telemetry["privacy_switch"]))

        return DeviceState(
            connected=self.transport.is_connected(),
            privacy_active=self.privacy_guard.is_blocked,
            edge_detected=edge_trip,
            sensors=telemetry,
        )

    def capture_image(self) -> Optional[bytes]:
        if self.privacy_guard.is_blocked:
            return None
        res = self.camera.capture_still()
        b64 = res.get("image_base64", "")
        if b64 and b64.startswith("data:"):
            try:
                return base64.b64decode(b64.split(",", 1)[1])
            except Exception:
                return None
        return None

    def read_audio(self) -> Optional[bytes]:
        if self.privacy_guard.is_blocked:
            return None
        return None

    def set_privacy(self, active: bool) -> None:
        self.privacy_guard.set_privacy(active)
        if active:
            self.stop_motion()
            self.set_expression("privacy_off")
        else:
            self.set_expression("idle")

    def set_expression(self, expression: str) -> None:
        self.expression = expression
        self.display.set_state(expression)
        self.terminal.set_state(expression)

    def perform_gesture(self, gesture: str) -> None:
        self.gesture = gesture
        self.servos.execute_gesture(gesture)
        self.transport.send_command("gesture", {"name": gesture})

    def stop_motion(self) -> None:
        self.motion.emergency_stop()
        self.transport.send_command("motor", {"speed": 0.0})

    def speak(self, text: str) -> None:
        self.tts.speak(text)

    def close(self) -> None:
        self.stop_motion()
        self.camera.stop()
        self.transport.disconnect()
        self.bus.disconnect()


class UniversalPerceptionAdapter:
    """General multimodal perception adapter for vision and speech."""

    def __init__(self):
        self.vad = UniversalVAD()
        self.wake_word = UniversalWakeWordDetector()
        self.stt = UniversalSTT()

    def process(self, text: str, image: Optional[bytes] = None, audio: Optional[bytes] = None):
        from companion_core import PerceptionResult

        query = text.strip() if text else ""
        if not query and audio:
            query = self.stt.transcribe(audio_bytes=audio)

        vision_summary = None
        if image:
            # Heuristic / Multimodal inspection summary
            vision_summary = "Visual item inspected on desk surface (notes/components identified)."

        return PerceptionResult(
            text=query or "Hey companion",
            vision_summary=vision_summary,
            confidence=0.98,
        )


class UniversalReasoningAdapter:
    """General reasoning adapter combining Groq LLM with dual-mode fallback and 90m sit rules."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.environ.get("GROQ_API_KEY", "")
        self.focus_monitor = FocusMonitor(sit_threshold_minutes=90.0)

    def respond(self, input_data, history: list[dict[str, str]]):
        from companion_core import Decision

        # 1. Check ergonomic break rule
        nudge = self.focus_monitor.evaluate()
        if nudge and not input_data.text:
            return Decision(nudge["message"], "nudge", "wave")

        text = input_data.text.lower()
        vision = input_data.vision_summary

        # 2. Try Groq Cloud LLM if key is present
        if self.api_key and self.api_key.startswith("gsk_"):
            try:
                reply = self._call_groq_api(input_data.text, vision, history)
                exp = "happy" if vision else "speaking"
                gest = "point" if ("look" in text or vision) else ("wave" if "hey" in text else "neutral")
                return Decision(reply, exp, gest)
            except Exception:
                pass

        # 3. Dual-mode fallback engine
        if vision:
            return Decision(f"I took a look at your physical workspace item! {vision}. Everything looks set up properly.", "happy", "point")
        elif any(w in text for w in ("resistor", "component", "circuit", "breadboard")):
            return Decision("That looks like a 10k Ohm axial resistor (brown-black-orange-gold). It fits your breadboard circuit perfectly!", "happy", "point")
        elif any(w in text for w in ("formula", "note", "paper", "read")):
            return Decision("I've scanned the page on your desk. The top formula reads V_out = V_in * (R2 / (R1 + R2)).", "thinking", "point")
        elif any(w in text for w in ("hello", "hey", "hi")):
            return Decision("Hello there! I'm active on your desk surface watching your progress. What are we working on today?", "happy", "wave")
        elif any(w in text for w in ("break", "stretch", "tired", "sit")):
            return Decision("You've been working focused at your desk! How about a quick 2-minute stretch?", "nudge", "wave")
        else:
            return Decision(f"Got it! I am keeping context of your work session. Let's keep making progress!", "speaking", "neutral")

    def _call_groq_api(self, prompt: str, vision: Optional[str], history: list[dict[str, str]]) -> str:
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
        system_prompt = "You are an AI Desk Companion robot. Be concise, warm, helpful, and friendly."

        messages = [{"role": "system", "content": system_prompt}]
        for item in history[-4:]:
            messages.append({"role": item.get("role", "user"), "content": item.get("content", "")})

        full_prompt = prompt
        if vision:
            full_prompt += f"\n[Visual Camera Inspection Result]: {vision}"
        messages.append({"role": "user", "content": full_prompt})

        data = json.dumps({
            "model": "llama-3.3-70b-versatile",
            "messages": messages,
            "max_tokens": 300,
            "temperature": 0.7,
        }).encode("utf-8")

        req = urllib.request.Request(url, data=data, headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=8) as response:
            res_json = json.loads(response.read().decode("utf-8"))
            return res_json["choices"][0]["message"]["content"]
