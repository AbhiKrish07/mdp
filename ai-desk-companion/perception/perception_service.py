"""
Perception Layer Service
Handles wake-word detection, speech-to-text, face/motion detection, and document/component vision analysis.
"""

import os
import base64
from typing import Dict, Any, Optional

class PerceptionService:
    def __init__(self, sensing_service=None, settings: Dict[str, Any] = None):
        self.sensing_service = sensing_service
        self.settings = settings or {}
        self.wake_word = self.settings.get("wake_word", "hey companion")

    def detect_wake_word(self, audio_chunk: Optional[bytes] = None) -> bool:
        """Local wake-word detection check."""
        if self.sensing_service and self.sensing_service.privacy_switch_active:
            return False
        # Simulated wake-word detection or keyword match
        return True

    def process_speech_to_text(self, audio_data: bytes = None, text_override: str = None) -> str:
        """Converts spoken audio to text."""
        if text_override:
            return text_override.strip()
        return "Hey companion, can you read this handwritten formula on my desk?"

    def detect_face_and_motion(self) -> Dict[str, Any]:
        """Continuous lightweight face tracking and desk presence detection."""
        if self.sensing_service and self.sensing_service.privacy_switch_active:
            return {"user_present": False, "face_detected": False, "face_position": None}
            
        return {
            "user_present": True,
            "face_detected": True,
            "face_position": {"x": 0.5, "y": 0.4}, # normalized center coordinates
            "distance_estimate_m": 0.65
        }

    def analyze_vision_target(self, image_data: str = None, prompt: str = "Analyze this image on my desk") -> Dict[str, Any]:
        """Triggered vision call for reading documents, notes, textbook pages, or components."""
        if self.sensing_service and self.sensing_service.privacy_switch_active:
            return {
                "success": False,
                "error": "Privacy switch is ON. Vision processing disabled."
            }

        # Structure analysis payload for Groq / Multimodal Vision LLM
        return {
            "success": True,
            "prompt": prompt,
            "has_image": bool(image_data),
            "target_type": "document_or_component",
            "summary": "Document containing circuit diagram and handwritten notes: 'Resistor value 10k, V_in = 5V'."
        }
