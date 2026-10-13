"""Unified Voice Pipeline.
Orchestrates Audio In -> VAD -> Wake Word -> STT -> Reasoning -> TTS -> Audio Out.
Replaces the complex monolithic OpenVoiceOS repository with a clean, extensible loop.
"""

import time
import logging
from typing import Callable, Optional, Dict, Any
from .vad import UniversalVAD
from .wake_word import UniversalWakeWordDetector
from .stt import UniversalSTT
from .tts import UniversalTTS

logger = logging.getLogger("VoicePipeline")

class VoicePipeline:
    """Manages full voice dialog lifecycle with barge-in interruption capability."""

    def __init__(
        self,
        vad: Optional[UniversalVAD] = None,
        wake_word: Optional[UniversalWakeWordDetector] = None,
        stt: Optional[UniversalSTT] = None,
        tts: Optional[UniversalTTS] = None,
        on_query_callback: Optional[Callable[[str], Any]] = None,
    ):
        self.vad = vad or UniversalVAD()
        self.wake_word = wake_word or UniversalWakeWordDetector()
        self.stt = stt or UniversalSTT()
        self.tts = tts or UniversalTTS()
        self.on_query = on_query_callback

        self.audio_buffer = bytearray()
        self.listening_for_utterance = False
        self.is_speaking = False

    def feed_audio_chunk(self, pcm_chunk: bytes) -> Optional[Dict[str, Any]]:
        """Consumes a real-time PCM audio chunk and handles state transitions."""
        vad_res = self.vad.process_chunk(pcm_chunk)

        # 1. If currently in wake-listening state
        if not self.listening_for_utterance:
            if self.wake_word.process_pcm_frame(pcm_chunk):
                self.listening_for_utterance = True
                self.audio_buffer.clear()
                logger.info("[VoicePipeline] Wake phrase triggered. Listening for query...")
                return {"event": "wake_detected"}

        # 2. If listening for user query
        if self.listening_for_utterance:
            self.audio_buffer.extend(pcm_chunk)

            if vad_res["utterance_ended"]:
                self.listening_for_utterance = False
                user_audio = bytes(self.audio_buffer)
                self.audio_buffer.clear()

                # Transcribe speech
                text = self.stt.transcribe(audio_bytes=user_audio)
                logger.info(f"[VoicePipeline] Transcribed query: '{text}'")

                # Trigger reasoning callback
                reply = None
                if self.on_query:
                    reply = self.on_query(text)

                return {
                    "event": "query_completed",
                    "user_text": text,
                    "reply": reply,
                }

        return None
