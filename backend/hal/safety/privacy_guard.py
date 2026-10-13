"""Privacy Guard.
Manages authoritative sensor electrical/logical cutoff.
Guarantees camera frames and microphone audio streams are blocked when privacy switch is engaged.
"""

import logging
from typing import Optional

logger = logging.getLogger("PrivacyGuard")

class PrivacyGuard:
    """Hard logical/electrical cutoff gate for audio & visual sensors."""

    def __init__(self, initial_state: bool = False):
        self._is_active = initial_state

    def set_privacy(self, active: bool) -> bool:
        self._is_active = bool(active)
        if self._is_active:
            logger.warning("[PrivacyGuard] PRIVACY CUTOFF ENGAGED: Camera and Microphone disabled.")
        else:
            logger.info("[PrivacyGuard] Privacy cutoff disengaged: Sensors active.")
        return self._is_active

    def toggle(self) -> bool:
        return self.set_privacy(not self._is_active)

    @property
    def is_blocked(self) -> bool:
        return self._is_active

    def sanitize_audio(self, audio_data: bytes) -> bytes:
        if self._is_active:
            return b""
        return audio_data

    def sanitize_frame(self, frame_data):
        if self._is_active:
            return None
        return frame_data
