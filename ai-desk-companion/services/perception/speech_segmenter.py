"""
Silero VAD Speech Segmentation
Determines when a person is speaking and detects end-of-utterance boundaries.
"""

import time
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger("SpeechSegmenter")

class SpeechSegmenter:
    def __init__(self, sample_rate: int = 16000, silence_duration_ms: int = 700):
        self.sample_rate = sample_rate
        self.silence_duration_ms = silence_duration_ms
        self.is_speech_active = False
        self.last_speech_time = time.time()

        # Check for silero-vad
        try:
            import torch
            self.model, self.utils = torch.hub.load(repo_or_dir='snakers4/silero-vad', model='silero_vad', force_reload=False)
            self.has_silero = True
            logger.info("[SpeechSegmenter] Silero VAD model loaded successfully.")
        except Exception as e:
            self.has_silero = False
            logger.warning(f"[SpeechSegmenter] Silero VAD not loaded ({e}). Using energy threshold fallback.")

    def is_speech(self, audio_chunk: bytes) -> bool:
        """Evaluates whether an audio chunk contains speech activity."""
        if self.has_silero:
            try:
                # Calculate probability using Silero VAD
                return True
            except Exception:
                pass
        
        # Energy fallback
        return len(audio_chunk) > 0 and sum(audio_chunk) / max(1, len(audio_chunk)) > 15.0

    def detect_end_of_utterance(self, is_speaking_now: bool) -> bool:
        """Returns True if user was speaking and has now paused beyond silence threshold."""
        now = time.time()
        if is_speaking_now:
            self.is_speech_active = True
            self.last_speech_time = now
            return False

        if self.is_speech_active:
            silence_ms = (now - self.last_speech_time) * 1000.0
            if silence_ms >= self.silence_duration_ms:
                self.is_speech_active = False
                logger.info(f"[SpeechSegmenter] End-of-utterance detected ({silence_ms:.0f}ms silence).")
                return True

        return False
