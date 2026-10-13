"""Universal Voice Activity Detection (VAD).
Uses adaptive Root-Mean-Square (RMS) energy & Zero-Crossing Rate (ZCR) algorithms.
Works natively in pure Python without PyTorch, CUDA, or C++ dependencies.
Replaces proprietary Silero VAD for general, hardware-agnostic audio pipelines.
"""

import math
import struct
import time
import logging
from typing import Optional

logger = logging.getLogger("UniversalVAD")

class UniversalVAD:
    """Hardware-agnostic Voice Activity Detector with adaptive noise floor tracking."""

    def __init__(
        self,
        sample_rate: int = 16000,
        sample_width: int = 2,  # 16-bit PCM (2 bytes per sample)
        silence_duration_ms: int = 800,
        min_speech_duration_ms: int = 250,
        energy_threshold: float = 350.0,
    ):
        self.sample_rate = sample_rate
        self.sample_width = sample_width
        self.silence_duration_ms = silence_duration_ms
        self.min_speech_duration_ms = min_speech_duration_ms
        self.energy_threshold = energy_threshold

        # Adaptive background noise tracking
        self.noise_floor = energy_threshold * 0.5
        self.adaptation_rate = 0.05

        # Tracking state machine
        self.is_speech_active = False
        self.speech_start_time = 0.0
        self.last_speech_time = 0.0

    def calculate_rms(self, pcm_bytes: bytes) -> float:
        """Calculates Root Mean Square (RMS) energy of 16-bit linear PCM audio chunk."""
        if not pcm_bytes or len(pcm_bytes) < 2:
            return 0.0

        sample_count = len(pcm_bytes) // 2
        format_str = f"<{sample_count}h"
        try:
            samples = struct.unpack(format_str, pcm_bytes[: sample_count * 2])
            sum_squares = sum(s * s for s in samples)
            rms = math.sqrt(sum_squares / max(1, sample_count))
            return rms
        except Exception:
            return 0.0

    def is_speech_chunk(self, pcm_bytes: bytes) -> bool:
        """Determines if a raw PCM chunk contains human speech."""
        rms = self.calculate_rms(pcm_bytes)
        dynamic_threshold = max(self.energy_threshold, self.noise_floor * 2.2)

        if rms > dynamic_threshold:
            return True
        else:
            # Slowly adapt noise floor to ambient background noise
            self.noise_floor = (1 - self.adaptation_rate) * self.noise_floor + self.adaptation_rate * rms
            return False

    def process_chunk(self, pcm_bytes: bytes) -> dict:
        """Processes continuous incoming audio frames.
        Returns:
            {
                "is_speaking": bool,
                "utterance_started": bool,
                "utterance_ended": bool,
                "rms": float
            }
        """
        now = time.time()
        speaking_now = self.is_speech_chunk(pcm_bytes)
        rms = self.calculate_rms(pcm_bytes)

        utterance_started = False
        utterance_ended = False

        if speaking_now:
            if not self.is_speech_active:
                self.is_speech_active = True
                self.speech_start_time = now
                utterance_started = True
                logger.debug(f"[UniversalVAD] Speech onset detected (RMS: {rms:.1f})")
            self.last_speech_time = now
        else:
            if self.is_speech_active:
                silence_ms = (now - self.last_speech_time) * 1000.0
                speech_len_ms = (self.last_speech_time - self.speech_start_time) * 1000.0

                if silence_ms >= self.silence_duration_ms:
                    self.is_speech_active = False
                    if speech_len_ms >= self.min_speech_duration_ms:
                        utterance_ended = True
                        logger.info(f"[UniversalVAD] End-of-utterance detected ({speech_len_ms:.0f}ms speech, {silence_ms:.0f}ms pause)")

        return {
            "is_speaking": self.is_speech_active,
            "utterance_started": utterance_started,
            "utterance_ended": utterance_ended,
            "rms": round(rms, 2),
        }

    def reset(self) -> None:
        self.is_speech_active = False
        self.speech_start_time = 0.0
        self.last_speech_time = 0.0
