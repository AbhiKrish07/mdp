"""Bidirectional Safety Watchdog.
Ensures host control loop and microcontroller are in constant contact.
If heartbeat pulse is lost beyond timeout (default 2000ms), triggers failsafe stop.
"""

import time
import logging
from typing import Callable, Optional

logger = logging.getLogger("SafetyWatchdog")

class SafetyWatchdog:
    """Monitors heartbeat liveness and triggers emergency callback if timed out."""

    def __init__(self, timeout_sec: float = 2.0, on_timeout: Optional[Callable[[], None]] = None):
        self.timeout_sec = timeout_sec
        self.on_timeout = on_timeout
        self.last_heartbeat = time.time()
        self.is_healthy = True

    def feed(self) -> None:
        """Feed the watchdog with a fresh heartbeat."""
        self.last_heartbeat = time.time()
        self.is_healthy = True

    def check(self) -> bool:
        """Returns True if healthy, False if timed out."""
        elapsed = time.time() - self.last_heartbeat
        if elapsed > self.timeout_sec:
            if self.is_healthy:
                self.is_healthy = False
                logger.error(f"[SafetyWatchdog] WATCHDOG TIMEOUT ({elapsed:.2f}s > {self.timeout_sec}s)! Failsafe tripped.")
                if self.on_timeout:
                    self.on_timeout()
            return False
        return True
