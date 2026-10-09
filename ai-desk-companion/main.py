"""
AI Desk Companion - Main Application Orchestrator
Connects Sensing, Perception, Reasoning, Action, and Storage layers via an async event loop.
"""

import asyncio
import time
import argparse
from typing import Dict, Any

from storage.storage_service import StorageService
from sensing.sensing_service import SensingService
from perception.perception_service import PerceptionService
from reasoning.reasoning_service import ReasoningService
from action.action_service import ActionService

class AIDeskCompanion:
    def __init__(self, api_key: str = None):
        print("🤖 Initializing AI Desk Companion System...")
        
        # Storage Layer
        self.storage = StorageService()
        
        # Sensing Layer
        self.sensing = SensingService(
            settings=self.storage.settings.get("system", {}),
            calibration=self.storage.calibration.get("sensors", {})
        )
        
        # Perception Layer
        self.perception = PerceptionService(
            sensing_service=self.sensing,
            settings=self.storage.settings.get("perception", {})
        )
        
        # Reasoning Layer
        self.reasoning = ReasoningService(
            storage_service=self.storage,
            api_key=api_key
        )
        
        # Action Layer
        self.action = ActionService(
            settings=self.storage.settings.get("action", {}),
            calibration=self.storage.calibration.get("servos", {})
        )
        
        self.running = False
        self.sit_start_time = time.time()
        print("✓ AI Desk Companion Initialized Successfully.")

    async def run_interaction_loop(self, text_input: str = None, vision_image: str = None) -> Dict[str, Any]:
        """Main end-to-end processing pipeline: Sensing -> Perception -> Reasoning -> Action -> Storage."""
        print("\n--- [Pipeline Triggered] ---")
        
        # 1. Sensing & Privacy check
        if self.sensing.privacy_switch_active:
            print("[Privacy] Privacy switch is active. Blocking camera & microphone.")
            return {
                "status": "privacy_blocked",
                "message": "Privacy switch is ON. Direct hardware cutoff engaged."
            }

        # 2. Perception
        user_query = self.perception.process_speech_to_text(text_override=text_input)
        vision_info = None
        if vision_image:
            v_res = self.perception.analyze_vision_target(image_data=vision_image)
            vision_info = v_res.get("summary")

        print(f"[Perception] STT: '{user_query}' | Vision: {vision_info or 'None'}")

        # 3. Reasoning
        history = self.storage.get_recent_history(limit=5)
        reason_res = self.reasoning.process_query(user_query, vision_context=vision_info, session_history=history)
        reply = reason_res["response"]
        gesture = reason_res["gesture"]
        expression = reason_res["expression"]

        print(f"[Reasoning] Reply: '{reply}'")
        print(f"[Reasoning] Expression: {expression} | Gesture: {gesture}")

        # 4. Action
        self.action.set_face_state(expression)
        gesture_res = self.action.execute_arm_gesture(gesture)
        speech_res = self.action.speak_text(reply)

        # 5. Storage
        self.storage.log_interaction("user", "chat", user_query)
        self.storage.log_interaction("assistant", "chat", reply, metadata=f"expression={expression},gesture={gesture}")

        return {
            "status": "success",
            "user_query": user_query,
            "assistant_reply": reply,
            "expression": expression,
            "gesture": gesture,
            "tts": speech_res
        }

    async def check_sit_timer_rule(self) -> Dict[str, Any]:
        """Periodic background task evaluating situational sit duration."""
        sit_minutes = (time.time() - self.sit_start_time) / 60.0
        rule_trigger = self.reasoning.evaluate_situational_rules(sit_minutes)
        if rule_trigger:
            print(f"[Rules Engine] Triggered: {rule_trigger['message']}")
            self.action.set_face_state(rule_trigger["expression"])
            self.action.execute_arm_gesture(rule_trigger["gesture"])
            self.storage.log_interaction("assistant", "break_nudge", rule_trigger["message"])
            return rule_trigger
        return {"sit_minutes": sit_minutes, "triggered": False}

async def main():
    parser = argparse.ArgumentParser(description="AI Desk Companion CLI Orchestrator")
    parser.add_argument("--query", type=str, help="Single query test mode")
    parser.add_argument("--api-key", type=str, help="Groq API Key")
    args = parser.parse_args()

    companion = AIDeskCompanion(api_key=args.api_key)
    query = args.query or "Hey companion, what can you see on my desk?"
    result = await companion.run_interaction_loop(text_input=query)
    print("\nResult Summary:", result)

if __name__ == "__main__":
    asyncio.run(main())
