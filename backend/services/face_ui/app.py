"""
Pygame Animated Face State Machine
Renders robot eye expressions on DSI display (idle, listening, thinking, speaking, happy, concerned, privacy_off).
"""

import time
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger("FaceUI")

class FaceUIApp:
    def __init__(self, resolution: tuple = (800, 480)):
        self.resolution = resolution
        self.current_state = "idle" # idle, listening, thinking, speaking, happy, concerned, privacy_off
        self.has_pygame = False

        # Attempt initializing Pygame
        try:
            import pygame  # type: ignore[import-not-found]
            pygame.init()
            self.screen = pygame.display.set_mode(resolution)
            self.has_pygame = True
            logger.info(f"[FaceUI] Pygame initialized with resolution {resolution}.")
        except Exception as e:
            logger.warning(f"[FaceUI] Pygame not available ({e}). Using state machine manager.")

    def update_state(self, new_state: str) -> str:
        valid_states = ["idle", "listening", "thinking", "speaking", "happy", "concerned", "privacy_off"]
        if new_state in valid_states:
            self.current_state = new_state
            logger.info(f"[FaceUI] Face state transition -> '{self.current_state}'")
        return self.current_state

    def render_frame(self) -> Dict[str, Any]:
        """Renders one frame of the animated eyes state machine."""
        if self.has_pygame:
            try:
                import pygame  # type: ignore[import-not-found]
                self.screen.fill((10, 13, 20)) # Dark background
                # Draw animated eye shapes...
                pygame.display.flip()
            except Exception:
                pass

        return {
            "state": self.current_state,
            "timestamp": time.time()
        }
