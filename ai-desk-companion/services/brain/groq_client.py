"""
Groq Python SDK Brain Client
Handles LLM conversation, vision queries, and tool requests.
"""

import os
import json
import logging
from typing import Dict, Any, List, Optional
from services.brain.tool_registry import PERMITTED_TOOLS, ToolValidator

logger = logging.getLogger("GroqBrain")

class GroqBrainClient:
    def __init__(self, api_key: Optional[str] = None, model: str = "llama-3.3-70b-versatile"):
        self.api_key = api_key or os.environ.get("GROQ_API_KEY", "")
        self.model = model
        self.has_groq_sdk = False
        self.client = None

        # Attempt Groq Python SDK import
        try:
            from groq import Groq
            if self.api_key and self.api_key.startswith("gsk_"):
                self.client = Groq(api_key=self.api_key)
                self.has_groq_sdk = True
                logger.info(f"[GroqBrain] Groq SDK initialized with model '{model}'.")
            else:
                logger.warning("[GroqBrain] GROQ_API_KEY not set. Using dual-mode fallback engine.")
        except Exception as e:
            logger.warning(f"[GroqBrain] Groq SDK not available ({e}). Using dual-mode fallback engine.")

    def generate_response(self, prompt: str, history: List[Dict[str, Any]] = None, vision_summary: Optional[str] = None) -> Dict[str, Any]:
        """Generates AI companion response, validating tool calls."""
        # Check Groq SDK
        if self.has_groq_sdk and self.client:
            try:
                messages = [
                    {"role": "system", "content": "You are an AI Desk Companion robot. Be concise, warm, helpful, and friendly. Use tools when appropriate."}
                ]
                if history:
                    messages.extend(history[-4:])
                
                user_content = prompt
                if vision_summary:
                    user_content += f"\n[Camera Vision Inspection Result]: {vision_summary}"
                messages.append({"role": "user", "content": user_content})

                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    tools=PERMITTED_TOOLS,
                    tool_choice="auto",
                    temperature=0.7,
                    max_tokens=300
                )
                
                msg = response.choices[0].message
                content = msg.content or ""
                
                tool_results = []
                if msg.tool_calls:
                    for tc in msg.tool_calls:
                        tool_name = tc.function.name
                        try:
                            args = json.loads(tc.function.arguments)
                        except Exception:
                            args = {}
                        val_res = ToolValidator.validate_and_execute(tool_name, args)
                        tool_results.append(val_res)

                return {
                    "speech": content if content else "I've processed your request on the desk.",
                    "emotion": "happy" if vision_summary else "speaking",
                    "tool_calls": tool_results,
                    "source": "groq_sdk"
                }

            except Exception as e:
                logger.error(f"[GroqBrain] Groq SDK call failed: {e}. Falling back to Dual-Mode engine.")

        # Dual-mode fallback engine
        return self._fallback_response(prompt, vision_summary)

    def _fallback_response(self, prompt: str, vision_summary: Optional[str] = None) -> Dict[str, Any]:
        p = prompt.lower()
        if vision_summary:
            speech = f"I've inspected your workspace item! {vision_summary}."
            gesture = "point"
            emotion = "happy"
        elif "resistor" in p or "component" in p:
            speech = "That looks like a 10k Ohm axial resistor (brown-black-orange-gold). Perfect for your breadboard!"
            gesture = "point"
            emotion = "happy"
        elif "note" in p or "formula" in p:
            speech = "I've scanned the page on your desk. The equation is V_out = V_in * (R2 / (R1 + R2))."
            gesture = "point"
            emotion = "thinking"
        elif "hello" in p or "hey" in p:
            speech = "Hello! I am right here on your desk. What are we working on today?"
            gesture = "wave"
            emotion = "happy"
        else:
            speech = "I am tracking your desk work session. Let's keep making progress!"
            gesture = "neutral"
            emotion = "speaking"

        return {
            "speech": speech,
            "emotion": emotion,
            "gesture": gesture,
            "source": "dual_mode_mock"
        }
