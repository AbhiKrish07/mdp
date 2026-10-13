"""Terminal / Console ASCII Eye Renderer.
Allows debugging robot face expressions directly in stdout/CLI without any GUI library.
"""

import time
import logging
from typing import Dict, Any
from .base import BaseDisplayDriver

logger = logging.getLogger("TerminalDisplay")

class TerminalDisplayDriver(BaseDisplayDriver):
    """Zero-dependency ASCII face renderer for terminal and headless consoles."""

    EYE_PATTERNS = {
        "idle":       "[  o  ]   [  o  ]",
        "listening":  "[ (o) ]   [ (o) ]",
        "thinking":   "[  ^  ]   [  ~  ]",
        "speaking":   "[  O  ]   [  O  ]",
        "happy":      "[  ^  ]   [  ^  ]",
        "alert":      "[ <!> ]   [ <!> ]",
        "nudge":      "[  -  ]   [  o  ]",
        "privacy_off": "[  X  ]   [  X  ]  <PRIVACY CUTOFF>",
    }

    def __init__(self):
        self.current_state = "idle"

    def set_state(self, state: str) -> str:
        s = state.lower()
        if s in self.VALID_STATES:
            self.current_state = s
            logger.info(f"[FaceUI] State -> {s} : {self.EYE_PATTERNS.get(s, '')}")
        return self.current_state

    def get_state(self) -> str:
        return self.current_state

    def render_frame(self) -> Dict[str, Any]:
        return {
            "state": self.current_state,
            "ascii": self.EYE_PATTERNS.get(self.current_state, ""),
            "timestamp": time.time(),
        }
