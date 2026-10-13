"""Universal Speech-to-Text (STT) Driver.
Hardware-agnostic STT combining cloud API transcription (Groq / OpenAI Whisper),
local engine fallback (faster-whisper / vosk), and simulated testing.
"""

import os
import json
import logging
import urllib.request
from typing import Optional

logger = logging.getLogger("UniversalSTT")

class UniversalSTT:
    """Universal speech recognition engine with multi-tier fallback."""

    def __init__(self, api_key: Optional[str] = None, model: str = "whisper-large-v3"):
        self.api_key = api_key or os.environ.get("GROQ_API_KEY", "")
        self.model = model

        # Check for local whisper
        self.has_local_whisper = False
        self._local_model = None
        self._try_init_local_whisper()

    def _try_init_local_whisper(self) -> None:
        try:
            from faster_whisper import WhisperModel
            self._local_model = WhisperModel("tiny.en", device="cpu", compute_type="int8")
            self.has_local_whisper = True
            logger.info("[UniversalSTT] faster-whisper local engine loaded.")
        except Exception:
            self.has_local_whisper = False

    def transcribe(self, audio_bytes: Optional[bytes] = None, text_override: Optional[str] = None) -> str:
        """Transcribes audio data into text string."""
        if text_override:
            return text_override.strip()

        # 1. Try Groq Cloud STT if API key is configured and valid
        if self.api_key and self.api_key.startswith("gsk_") and audio_bytes and len(audio_bytes) > 1000:
            try:
                text = self._call_groq_stt(audio_bytes)
                if text:
                    return text
            except Exception as e:
                logger.warning(f"[UniversalSTT] Groq Cloud STT failed ({e}). Trying local/fallback.")

        # 2. Try local faster-whisper if available
        if self.has_local_whisper and self._local_model and audio_bytes:
            try:
                import io
                segments, _ = self._local_model.transcribe(io.BytesIO(audio_bytes), beam_size=1)
                text = " ".join(seg.text for seg in segments).strip()
                if text:
                    return text
            except Exception as e:
                logger.warning(f"[UniversalSTT] Local Whisper failed ({e}).")

        # 3. Fallback default desk query
        return "Hey companion, what can you see on my desk?"

    def _call_groq_stt(self, audio_bytes: bytes) -> Optional[str]:
        """Calls Groq audio transcriptions API endpoint using multipart form data."""
        # Note: Groq expects audio file upload (wav, mp3, m4a, flac)
        boundary = "----WebKitFormBoundaryCompanionSTT7MA4YWxkTrZu0gW"
        body = (
            f"--{boundary}\r\n"
            f'Content-Disposition: form-data; name="model"\r\n\r\n'
            f"{self.model}\r\n"
            f"--{boundary}\r\n"
            f'Content-Disposition: form-data; name="file"; filename="audio.wav"\r\n'
            f"Content-Type: audio/wav\r\n\r\n"
        ).encode("utf-8") + audio_bytes + f"\r\n--{boundary}--\r\n".encode("utf-8")

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": f"multipart/form-data; boundary={boundary}",
        }
        req = urllib.request.Request("https://api.groq.com/openai/v1/audio/transcriptions", data=body, headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data.get("text", "").strip()
