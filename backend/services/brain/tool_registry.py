"""
Tool Registry & Safety Validator for Groq Brain
Prevents raw GPIO/motor access by exposing only permitted high-level robot tools.
"""

import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger("ToolRegistry")

# Permitted Groq Tool Schemas
PERMITTED_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "look_at_desk",
            "description": "Trigger physical vision camera inspection of an item, handwritten note, or component on the desk.",
            "parameters": {
                "type": "object",
                "properties": {
                    "reason": {"type": "string", "description": "Why the camera inspection is requested."}
                },
                "required": ["reason"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "gesture",
            "description": "Perform an expressive arm gesture.",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {"type": "string", "enum": ["wave", "point", "nudge", "nod", "neutral"], "description": "Name of the allowed gesture."}
                },
                "required": ["name"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "set_emotion",
            "description": "Set animated eye expression state.",
            "parameters": {
                "type": "object",
                "properties": {
                    "emotion": {"type": "string", "enum": ["idle", "listening", "thinking", "speaking", "happy", "concerned", "privacy_off"], "description": "Name of the target expression."}
                },
                "required": ["emotion"]
            }
        }
    }
]

class ToolValidator:
    @staticmethod
    def validate_and_execute(tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Enforces safety allowlist before dispatching to hardware link."""
        if tool_name == "look_at_desk":
            logger.info(f"[Safety Validator] Approved 'look_at_desk': {arguments}")
            return {"status": "approved", "action": "trigger_vision_capture", "reason": arguments.get("reason")}

        elif tool_name == "gesture":
            g_name = arguments.get("name", "neutral")
            if g_name not in ["wave", "point", "nudge", "nod", "neutral"]:
                logger.warning(f"[Safety Validator] BLOCKED unsafe gesture '{g_name}'. Defaulting to neutral.")
                g_name = "neutral"
            logger.info(f"[Safety Validator] Approved 'gesture': {g_name}")
            return {"status": "approved", "action": "execute_gesture", "gesture": g_name}

        elif tool_name == "set_emotion":
            emo = arguments.get("emotion", "idle")
            if emo not in ["idle", "listening", "thinking", "speaking", "happy", "concerned", "privacy_off"]:
                emo = "idle"
            logger.info(f"[Safety Validator] Approved 'set_emotion': {emo}")
            return {"status": "approved", "action": "set_face_emotion", "emotion": emo}

        else:
            logger.error(f"[Safety Validator] BLOCKED unpermitted tool request '{tool_name}'! Direct GPIO/motor access denied.")
            return {"status": "denied", "error": f"Tool '{tool_name}' is not in the hardware safety allowlist."}
