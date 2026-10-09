"""
Reasoning Layer Service
Coordinates context management, Groq LLM brain calls (with dual live/offline fallback), and situational rules engine.
"""

import os
import time
import urllib.request
import json
from typing import Dict, Any, List, Optional

class ReasoningService:
    def __init__(self, storage_service=None, api_key: Optional[str] = None):
        self.storage = storage_service
        self.api_key = api_key or os.environ.get("GROQ_API_KEY", "")
        self.sit_start_time = time.time()
        self.last_break_reminder = 0.0

        self.system_prompt = (
            "You are an AI Desk Companion — a desk-mounted, mobile AI companion robot for engineers, developers, "
            "and students. You have animated eye expressions, small arms, and wheeled desk mobility. "
            "Keep your responses friendly, concise, natural, direct, and encouraging."
        )

    def process_query(self, user_text: str, vision_context: str = None, session_history: List[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Process user input with context manager and Groq API / fallback engine."""
        
        # Build prompt with history
        prompt_content = user_text
        if vision_context:
            prompt_content += f"\n\n[Visual Image Scan Context]: {vision_context}"

        # If Groq API key is present, execute live HTTP request to Groq API
        if self.api_key and self.api_key.startswith("gsk_"):
            try:
                reply = self._call_groq_api(prompt_content, session_history)
                return {
                    "source": "groq_api",
                    "response": reply,
                    "gesture": self._determine_gesture(reply),
                    "expression": self._determine_expression(reply)
                }
            except Exception as e:
                print(f"[ReasoningService] Groq API call failed: {e}. Falling back to Dual-Mode engine.")

        # Dual-mode fallback engine (offline / demo mode)
        reply = self._mock_reasoning_engine(user_text, vision_context)
        return {
            "source": "dual_mode_mock",
            "response": reply,
            "gesture": self._determine_gesture(reply),
            "expression": self._determine_expression(reply)
        }

    def _call_groq_api(self, prompt: str, history: List[Dict[str, Any]] = None) -> str:
        """Executes raw HTTP API request to Groq REST endpoint."""
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        messages = [{"role": "system", "content": self.system_prompt}]
        if history:
            for item in history[-4:]:
                messages.append({"role": item.get("role", "user"), "content": item.get("content", "")})
        messages.append({"role": "user", "content": prompt})

        data = json.dumps({
            "model": "llama-3.3-70b-versatile",
            "messages": messages,
            "max_tokens": 300,
            "temperature": 0.7
        }).encode("utf-8")

        req = urllib.request.Request(url, data=data, headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=8) as response:
            res_json = json.loads(response.read().decode("utf-8"))
            return res_json["choices"][0]["message"]["content"]

    def evaluate_situational_rules(self, current_sit_minutes: float) -> Optional[Dict[str, Any]]:
        """Rules Engine: Explicit pattern-based check-ins (e.g. no motion/sound for 90m -> break reminder)."""
        threshold = 90.0
        if self.storage:
            threshold = float(self.storage.get_setting("reasoning", "sit_threshold_minutes", 90))

        if current_sit_minutes >= threshold and (time.time() - self.last_break_reminder > 1800):
            self.last_break_reminder = time.time()
            return {
                "triggered_rule": "long_sit_break_reminder",
                "sit_minutes": current_sit_minutes,
                "message": f"Hey! You've been sitting focused at your desk for {int(current_sit_minutes)} minutes. How about standing up for a quick 2-minute stretch?",
                "expression": "nudge",
                "gesture": "wave_gently"
            }
        return None

    def _determine_gesture(self, text: str) -> str:
        t = text.lower()
        if "look" in t or "this" in t or "diagram" in t or "resistor" in t:
            return "point"
        elif "stretch" in t or "break" in t or "hey" in t:
            return "wave"
        elif "nudge" in t or "check" in t:
            return "nudge"
        return "neutral"

    def _determine_expression(self, text: str) -> str:
        t = text.lower()
        if "great" in t or "awesome" in t or "happy" in t or "stretch" in t:
            return "happy"
        elif "looking" in t or "reading" in t or "analyzing" in t:
            return "thinking"
        elif "warning" in t or "careful" in t:
            return "alert"
        return "speaking"

    def _mock_reasoning_engine(self, user_text: str, vision_context: str = None) -> str:
        text = user_text.lower()
        if vision_context:
            return f"I took a look at your physical workspace item! {vision_context}. Everything looks correctly set up for your project."
        if "resistor" in text or "component" in text:
            return "That looks like a 10k Ohm axial resistor (brown-black-orange-gold). It fits your breadboard circuit perfectly!"
        if "note" in text or "read" in text or "paper" in text:
            return "I've scanned the page on your desk. The top formula reads V_out = V_in * (R2 / (R1 + R2))."
        if "hello" in text or "hey" in text:
            return "Hello there! I'm right here on your desk watching your progress. What are we working on today?"
        return f"Got it! I am keeping context of your work session. Let's keep making progress!"
