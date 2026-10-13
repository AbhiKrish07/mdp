"""Hardware Abstraction Layer (HAL) for AI Desk Companion.
Provides modular, hardware-agnostic drivers for bus IPC, vision, audio, motion, actuators, display, transport, and safety.
"""

from .bus.base import BaseEventBus, TOPICS
from .bus.memory_bus import MemoryEventBus
from .camera.base import BaseCameraDriver
from .audio.vad import UniversalVAD
from .audio.wake_word import UniversalWakeWordDetector
from .audio.stt import UniversalSTT
from .audio.tts import UniversalTTS
from .motion.base import BaseMotionDriver
from .actuators.servo_controller import ServoController
from .transport.base import BaseTransport
from .safety.edge_guard import EdgeGuard
from .safety.watchdog import SafetyWatchdog
from .safety.privacy_guard import PrivacyGuard

__all__ = [
    "BaseEventBus",
    "TOPICS",
    "MemoryEventBus",
    "BaseCameraDriver",
    "UniversalVAD",
    "UniversalWakeWordDetector",
    "UniversalSTT",
    "UniversalTTS",
    "BaseMotionDriver",
    "ServoController",
    "BaseTransport",
    "EdgeGuard",
    "SafetyWatchdog",
    "PrivacyGuard",
]
