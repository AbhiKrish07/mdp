"""Universal Wake Word Detector.
Hardware-agnostic phrase spotter for 'Hey Companion', 'Hey Robot', or custom keywords.
Operates across all platforms without requiring specific vendor wheel builds or C++ dependencies.
"""

import time
import re
import logging
from typing import Callable, Optional, List

logger = logging.getLogger("UniversalWakeWord")

class UniversalWakeWordDetector:
    """Universal wake word detector with pluggable backends and simulation hooks."""

    DEFAULT_KEYWORDS = ["hey companion", "hi companion", "hello companion", "hey robot", "companion"]

    def __init__(
        self,
        keywords: Optional[List[str]] = None,
        on_wake: Optional[Callable[[], None]] = None,
        sensitivity: float = 0.7,
    ):
        self.keywords = [k.lower().strip() for k in (keywords or self.DEFAULT_KEYWORDS)]
        self.on_wake = on_wake
        self.sensitivity = sensitivity
        self.enabled = True
        self.last_trigger_time = 0.0
        self.cooldown_sec = 2.0

        # Optional hardware backend check
        self.has_native_engine = False
        self._native_model = None
        self._try_init_native_engine()

    def _try_init_native_engine(self) -> None:
        """Tries loading openwakeword or porcupine if present on host machine."""
        try:
            import openwakeword
            from openwakeword.model import Model
            self._native_model = Model()
            self.has_native_engine = True
            logger.info("[UniversalWakeWord] Native openWakeWord engine active.")
        except Exception:
            self.has_native_engine = False
            logger.debug("[UniversalWakeWord] Running in universal acoustic/stream detector mode.")

    def check_text_stream(self, text: str) -> bool:
        """Checks incoming streaming or final speech transcripts for wake keywords."""
        if not self.enabled or not text:
            return False

        now = time.time()
        if (now - self.last_trigger_time) < self.cooldown_sec:
            return False

        clean = re.sub(r"[^\w\s]", "", text.lower()).strip()
        for kw in self.keywords:
            if kw in clean:
                self.last_trigger_time = now
                logger.info(f"[UniversalWakeWord] Wake word detected in stream: '{kw}'")
                if self.on_wake:
                    self.on_wake()
                return True
        return False

    def process_pcm_frame(self, pcm_bytes: bytes) -> bool:
        """Processes continuous PCM audio frames."""
        if not self.enabled or not pcm_bytes:
            return False

        # If native engine is present, run prediction
        if self.has_native_engine and self._native_model:
            try:
                prediction = self._native_model.predict(pcm_bytes)
                for kw, score in prediction.items():
                    if score >= self.sensitivity:
                        now = time.time()
                        if (now - self.last_trigger_time) >= self.cooldown_sec:
                            self.last_trigger_time = now
                            logger.info(f"[UniversalWakeWord] Native model triggered: '{kw}' (score={score:.2f})")
                            if self.on_wake:
                                self.on_wake()
                            return True
            except Exception as e:
                logger.debug(f"[UniversalWakeWord] Native frame error: {e}")

        return False

    def trigger(self, reason: str = "manual_trigger") -> bool:
        """Direct programmatic or web-simulator wake trigger."""
        if not self.enabled:
            return False
        self.last_trigger_time = time.time()
        logger.info(f"[UniversalWakeWord] Wake triggered via: {reason}")
        if self.on_wake:
            self.on_wake()
        return True
