"""Web Event Display Driver.
Broadcasts eye expressions and emotional states to web simulator or WebSocket frontend.
"""

import time
import logging
from typing import Dict, Any, Optional
from .base import BaseDisplayDriver

logger = logging.getLogger("WebEventDisplay")

class WebEventDisplayDriver(BaseDisplayDriver):
    """Dispatches display states to connected web simulators and REST clients."""

    def __init__(self, event_bus=None):
        self.current_state = "idle"
        self.event_bus = event_bus

    def set_state(self, state: str) -> str:
        s = state.lower()
        if s in self.VALID_STATES:
            self.current_state = s
            if self.event_bus:
                self.event_bus.publish("robot/assistant/state", {
                    "state": self.current_state,
                    "timestamp": time.time(),
                })
        return self.current_state

    def get_state(self) -> str:
        return self.current_state

    def render_frame(self) -> Dict[str, Any]:
        return {
            "state": self.current_state,
            "mode": "web_stream",
            "timestamp": time.time(),
        }
