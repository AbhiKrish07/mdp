"""
Conversation State & Memory Manager
"""

import time
from typing import List, Dict, Any

class ConversationManager:
    def __init__(self, max_history: int = 10):
        self.max_history = max_history
        self.history: List[Dict[str, Any]] = []

    def add_turn(self, role: str, content: str):
        self.history.append({
            "role": role,
            "content": content,
            "timestamp": time.time()
        })
        if len(self.history) > self.max_history:
            self.history.pop(0)

    def get_context(self) -> List[Dict[str, Any]]:
        return self.history
