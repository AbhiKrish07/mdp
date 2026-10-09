"""
Situational Awareness Rules Engine
Evaluates sit duration and triggers break nudges or check-in notifications.
"""

import time
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger("RulesEngine")

class RulesEngine:
    def __init__(self, sit_threshold_minutes: float = 90.0):
        self.sit_threshold_minutes = sit_threshold_minutes
        self.session_start = time.time()
        self.last_nudge_time = 0.0

    def check_sit_duration(self) -> Optional[Dict[str, Any]]:
        now = time.time()
        sit_mins = (now - self.session_start) / 60.0
        
        if sit_mins >= self.sit_threshold_minutes and (now - self.last_nudge_time > 1800):
            self.last_nudge_time = now
            logger.info(f"[RulesEngine] Long-sit threshold reached ({sit_mins:.1f} mins). Triggering break nudge.")
            return {
                "rule": "long_sit_break_nudge",
                "sit_minutes": round(sit_mins, 1),
                "speech": f"Hey! You've been working continuously for {int(sit_mins)} minutes. How about standing up for a quick 2-minute stretch?",
                "emotion": "concerned",
                "gesture": "wave"
            }

        return None
