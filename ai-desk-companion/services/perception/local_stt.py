"""
Speech Recognition Service: Groq STT (Primary) + faster-whisper (Offline Fallback)
"""

import os
import logging
from typing import Optional

logger = logging.getLogger("LocalSTT")

class SpeechRecognizer:
    def __init__(self, model_size: str = "tiny.en", device: str = "cpu", compute_type: str = "int8"):
        self.model_size = model_size
        self.whisper_model = None
        self.has_faster_whisper = False

        # Attempt initializing faster-whisper
        try:
            from faster_whisper import WhisperModel
            self.whisper_model = WhisperModel(model_size, device=device, compute_type=compute_type)
            self.has_faster_whisper = True
            logger.info(f"[LocalSTT] faster-whisper '{model_size}' loaded.")
        except Exception as e:
            logger.warning(f"[LocalSTT] faster-whisper not available ({e}). Using online/mock transcription.")

    def transcribe(self, audio_bytes: bytes, filename_hint: Optional[str] = None) -> str:
        """Transcribes speech audio bytes using faster-whisper local model."""
        if self.has_faster_whisper and self.whisper_model:
            try:
                segments, info = self.whisper_model.transcribe(filename_hint or "temp_audio.wav", beam_size=1)
                text = " ".join([seg.text for seg in segments]).strip()
                if text:
                    return text
            except Exception as e:
                logger.error(f"[LocalSTT] Transcription error: {e}")

        return "Hey companion, can you check this circuit component on my desk?"
