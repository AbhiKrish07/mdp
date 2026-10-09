"""
openWakeWord Trigger Phrase Detector
Detects local wake phrases (e.g. 'Hey Companion') from microphone PCM audio streams.
"""

import time
import logging
from typing import Callable, Optional

logger = logging.getLogger("WakeWordService")

class WakeWordDetector:
    def __init__(self, model_name: str = "hey_companion", score_threshold: float = 0.6, on_wake: Optional[Callable] = None):
        self.model_name = model_name
        self.score_threshold = score_threshold
        self.on_wake = on_wake
        self.enabled = True

        # Check for openWakeWord library
        try:
            import openwakeword
            from openwakeword.model import Model
            self.model = Model(wakeword_models=[model_name] if model_name in openwakeword.utils.get_pretrained_model_paths() else [])
            self.has_oww = True
            logger.info(f"[WakeWord] openWakeWord initialized with model '{model_name}'.")
        except Exception as e:
            self.model = None
            self.has_oww = False
            logger.warning(f"[WakeWord] openWakeWord not loaded ({e}). Using simulated audio frame stream detector.")

    def process_pcm_frame(self, pcm_data: bytes) -> bool:
        """Processes audio PCM frames continuously and triggers on_wake when score > threshold."""
        if not self.enabled:
            return False

        if self.has_oww and self.model:
            try:
                # Predict score from audio frame
                prediction = self.model.predict(pcm_data)
                score = prediction.get(self.model_name, 0.0)
                if score >= self.score_threshold:
                    logger.info(f"[WakeWord] Wake word '{self.model_name}' DETECTED! (Score: {score:.2f})")
                    if self.on_wake:
                        self.on_wake()
                    return True
            except Exception as e:
                logger.error(f"[WakeWord] Error during frame processing: {e}")

        return False

    def trigger_simulated_wake(self):
        """Simulate wake phrase trigger for testing/simulator interface."""
        logger.info("[WakeWord] Simulated wake phrase triggered!")
        if self.on_wake:
            self.on_wake()
        return True
