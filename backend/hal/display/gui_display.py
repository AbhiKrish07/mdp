"""Optional GUI display driver with Pygame / Tkinter adapter and fallback."""

import time
import logging
from typing import Dict, Any, Tuple
from .base import BaseDisplayDriver
from .terminal_display import TerminalDisplayDriver

logger = logging.getLogger("GUIDisplay")

class GUIDisplayDriver(BaseDisplayDriver):
    """Hybrid GUI Driver: uses Pygame if present, otherwise delegates to Terminal."""

    def __init__(self, resolution: Tuple[int, int] = (800, 480)):
        self.resolution = resolution
        self.current_state = "idle"
        self.has_pygame = False
        self.screen = None
        self.terminal_fallback = TerminalDisplayDriver()

        try:
            import pygame
            pygame.init()
            # Try headless dummy video driver if no display attached
            self.screen = pygame.display.set_mode(resolution)
            self.has_pygame = True
            logger.info(f"[GUIDisplay] Pygame display initialized at {resolution}")
        except Exception as e:
            self.has_pygame = False
            logger.debug(f"[GUIDisplay] Pygame not available ({e}). Using terminal fallback.")

    def set_state(self, state: str) -> str:
        s = state.lower()
        if s in self.VALID_STATES:
            self.current_state = s
            self.terminal_fallback.set_state(s)
        return self.current_state

    def get_state(self) -> str:
        return self.current_state

    def render_frame(self) -> Dict[str, Any]:
        if self.has_pygame and self.screen:
            try:
                import pygame
                self.screen.fill((10, 13, 20))
                pygame.display.flip()
            except Exception:
                pass
        return self.terminal_fallback.render_frame()
