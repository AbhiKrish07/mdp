"""Ergonomic Focus Monitor & Situational Rules Engine.
Tracks continuous sitting duration and triggers gentle break stretch nudges.
"""

import time
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger("FocusMonitor")

class FocusMonitor:
    """Monitors continuous desk work sessions and triggers wellness nudges."""

    def __init__(self, sit_threshold_minutes: float = 90.0, cooldown_minutes: float = 30.0):
        self.sit_threshold_minutes = sit_threshold_minutes
        self.cooldown_minutes = cooldown_minutes
        self.session_start = time.time()
        self.last_nudge_time = 0.0

    def evaluate(self, current_sit_minutes: Optional[float] = None) -> Optional[Dict[str, Any]]:
        now = time.time()
        mins = current_sit_minutes if current_sit_minutes is not None else ((now - self.session_start) / 60.0)

        if mins >= self.sit_threshold_minutes:
            if (now - self.last_nudge_time) >= (self.cooldown_minutes * 60.0):
                self.last_nudge_time = now
                logger.info(f"[FocusMonitor] Sit threshold breached ({mins:.1f} mins). Dispatching stretch nudge.")
                return {
                    "rule": "long_sit_break_nudge",
                    "sit_minutes": round(mins, 1),
                    "message": f"Hey! You've been working focused at your desk for {int(mins)} minutes. How about a quick 2-minute stretch?",
                    "expression": "nudge",
                    "gesture": "wave",
                }
        return None

    def reset_session(self) -> None:
        self.session_start = time.time()
