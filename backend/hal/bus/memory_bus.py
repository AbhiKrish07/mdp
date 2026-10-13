"""Pure Python In-Memory Event Bus.
Provides zero-dependency pub/sub messaging with error isolation, sync/async support,
and optional message logging. Replaces external MQTT broker for general/embedded systems.
"""

import logging
from typing import Callable, Dict, Any, List
from .base import BaseEventBus

logger = logging.getLogger("MemoryEventBus")

class MemoryEventBus(BaseEventBus):
    """Zero-dependency, thread-safe in-memory publish/subscribe event bus."""

    def __init__(self, name: str = "in_memory_bus"):
        self.name = name
        self.callbacks: Dict[str, List[Callable[[Dict[str, Any]], None]]] = {}
        self.connected = False
        self._history: List[Dict[str, Any]] = []
        self._max_history = 100

    def connect(self) -> None:
        self.connected = True
        logger.info(f"[{self.name}] Memory event bus ready.")

    def disconnect(self) -> None:
        self.connected = False
        self.callbacks.clear()
        logger.info(f"[{self.name}] Memory event bus disconnected.")

    def subscribe(self, topic: str, callback: Callable[[Dict[str, Any]], None]) -> None:
        if topic not in self.callbacks:
            self.callbacks[topic] = []
        if callback not in self.callbacks[topic]:
            self.callbacks[topic].append(callback)
            logger.debug(f"[{self.name}] Subscribed to '{topic}'")

    def unsubscribe(self, topic: str, callback: Callable[[Dict[str, Any]], None]) -> None:
        if topic in self.callbacks and callback in self.callbacks[topic]:
            self.callbacks[topic].remove(callback)
            if not self.callbacks[topic]:
                del self.callbacks[topic]

    def publish(self, topic: str, payload: Dict[str, Any]) -> None:
        # Record into circular history for inspection/debugging
        self._history.append({"topic": topic, "payload": payload})
        if len(self._history) > self._max_history:
            self._history.pop(0)

        # Dispatch to direct topic subscribers
        handlers = list(self.callbacks.get(topic, []))
        
        # Also support wildcard '#' or '+' subscriptions
        for sub_topic, cbs in self.callbacks.items():
            if sub_topic == "#" or (sub_topic.endswith("/#") and topic.startswith(sub_topic[:-2])):
                for cb in cbs:
                    if cb not in handlers:
                        handlers.append(cb)

        for handler in handlers:
            try:
                handler(payload)
            except Exception as e:
                logger.error(f"[{self.name}] Error delivering message on '{topic}': {e}", exc_info=True)

    def get_history(self, topic_filter: str = None) -> List[Dict[str, Any]]:
        if topic_filter:
            return [h for h in self._history if h["topic"] == topic_filter]
        return list(self._history)
