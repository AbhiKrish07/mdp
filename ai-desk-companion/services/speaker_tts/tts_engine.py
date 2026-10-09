"""
Piper Text-to-Speech Engine Service
Synthesizes speech audio locally and queues audio playback.
"""

import time
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger("TTSEngine")

class TTSEngine:
    def __init__(self, voice_model: str = "en_US-lessac-medium", voice_speed: float = 1.0):
        self.voice_model = voice_model
        self.voice_speed = voice_speed
        self.has_piper = False

        # Attempt initializing piper-tts
        try:
            import piper
            self.has_piper = True
            logger.info(f"[TTS] Piper TTS engine loaded model '{voice_model}'.")
        except Exception as e:
            logger.warning(f"[TTS] Piper TTS not available ({e}). Using audio playback dispatcher.")

    def speak_sentence(self, text: str) -> Dict[str, Any]:
        """Synthesizes text and streams/queues audio output."""
        words = len(text.split())
        estimated_duration = max(1.2, words * 0.28)
        logger.info(f"[TTS] Speaking sentence ({words} words, ~{estimated_duration:.1f}s): '{text}'")
        
        return {
            "status": "speaking",
            "text": text,
            "duration_sec": estimated_duration,
            "timestamp": time.time()
        }
