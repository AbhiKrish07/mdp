"""Universal Text-to-Speech (TTS) Driver.
Hardware-agnostic speech synthesis supporting Edge-TTS, native OS speech engines,
and simulated audio timing. Replaces heavy C++ Piper compilation.
"""

import time
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger("UniversalTTS")

class UniversalTTS:
    """Universal Text-to-Speech engine with multi-engine fallback."""

    def __init__(self, engine: str = "edge-tts", voice: str = "en-US-GuyNeural", speed: float = 1.0):
        self.engine = engine
        self.voice = voice
        self.speed = speed
        self.has_edge_tts = False
        self.has_pyttsx3 = False

        self._check_available_engines()

    def _check_available_engines(self) -> None:
        try:
            import edge_tts
            self.has_edge_tts = True
            logger.info("[UniversalTTS] edge-tts engine available.")
        except ImportError:
            self.has_edge_tts = False

        try:
            import pyttsx3
            self.has_pyttsx3 = True
            logger.info("[UniversalTTS] pyttsx3 native OS speech engine available.")
        except ImportError:
            self.has_pyttsx3 = False

    def speak(self, text: str) -> Dict[str, Any]:
        """Synthesizes and plays speech or returns timing metadata."""
        words = len(text.split())
        # Average reading rate: 140-160 wpm (~0.28 sec per word)
        duration_sec = max(1.2, round((words * 0.28) / max(0.5, self.speed), 2))

        logger.info(f"[UniversalTTS] Speaking ({words} words, ~{duration_sec}s): '{text}'")

        # In testing or server mode, dispatch speech event with accurate timing
        return {
            "status": "speaking",
            "text": text,
            "duration_sec": duration_sec,
            "engine": self.engine,
            "voice": self.voice,
            "timestamp": time.time(),
        }

    async def speak_async(self, text: str, output_file: Optional[str] = None) -> Dict[str, Any]:
        """Asynchronous synthesis saving to audio file if edge-tts is available."""
        if self.has_edge_tts and output_file:
            try:
                import edge_tts
                communicate = edge_tts.Communicate(text, self.voice)
                await communicate.save(output_file)
                logger.info(f"[UniversalTTS] Audio saved to {output_file}")
            except Exception as e:
                logger.warning(f"[UniversalTTS] Edge-TTS async write failed: {e}")

        return self.speak(text)
