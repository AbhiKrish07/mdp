"""Modular MQTT Adapter.
Connects to an external broker (Mosquitto/EMQX/HiveMQ) if available;
falls back to in-memory dispatch seamlessly when offline or uninstalled.
"""

import json
import logging
from typing import Callable, Dict, Any, List
from .base import BaseEventBus
from .memory_bus import MemoryEventBus

logger = logging.getLogger("MQTTBusAdapter")

class MQTTBusAdapter(BaseEventBus):
    """Hybrid Bus: Tries external MQTT if available, falls back to MemoryEventBus."""

    def __init__(self, host: str = "localhost", port: int = 1883, client_id: str = "ai_companion"):
        self.host = host
        self.port = port
        self.client_id = client_id
        self.fallback_bus = MemoryEventBus(name="mqtt_fallback_bus")
        self.has_paho = False
        self.client = None
        self.connected = False

        try:
            import paho.mqtt.client as mqtt
            self.client = mqtt.Client(client_id=client_id, clean_session=True)
            self.client.on_connect = self._on_connect
            self.client.on_disconnect = self._on_disconnect
            self.client.on_message = self._on_message
            self.has_paho = True
        except ImportError:
            logger.info("[MQTTBusAdapter] paho-mqtt not installed. Using in-memory bus directly.")

    def connect(self) -> None:
        self.fallback_bus.connect()
        if self.has_paho and self.client:
            try:
                self.client.connect_async(self.host, self.port, keepalive=60)
                self.client.loop_start()
            except Exception as e:
                logger.warning(f"[MQTTBusAdapter] Could not connect to {self.host}:{self.port} ({e}). Local fallback active.")
        else:
            self.connected = True

    def disconnect(self) -> None:
        self.connected = False
        if self.has_paho and self.client:
            try:
                self.client.loop_stop()
                self.client.disconnect()
            except Exception:
                pass
        self.fallback_bus.disconnect()

    def _on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            self.connected = True
            logger.info(f"[MQTTBusAdapter] Connected to broker at {self.host}:{self.port}")
            for topic in self.fallback_bus.callbacks.keys():
                self.client.subscribe(topic)
        else:
            logger.warning(f"[MQTTBusAdapter] Connect returned code {rc}. Using local fallback.")

    def _on_disconnect(self, client, userdata, rc):
        self.connected = False
        logger.warning(f"[MQTTBusAdapter] Disconnected from broker (rc={rc}).")

    def _on_message(self, client, userdata, msg):
        try:
            payload = json.loads(msg.payload.decode("utf-8"))
        except Exception:
            payload = {"raw": msg.payload.decode("utf-8", errors="ignore")}
        self.fallback_bus.publish(msg.topic, payload)

    def subscribe(self, topic: str, callback: Callable[[Dict[str, Any]], None]) -> None:
        self.fallback_bus.subscribe(topic, callback)
        if self.has_paho and self.client and self.connected:
            self.client.subscribe(topic)

    def unsubscribe(self, topic: str, callback: Callable[[Dict[str, Any]], None]) -> None:
        self.fallback_bus.unsubscribe(topic, callback)

    def publish(self, topic: str, payload: Dict[str, Any]) -> None:
        self.fallback_bus.publish(topic, payload)
        if self.has_paho and self.client and self.connected:
            try:
                self.client.publish(topic, json.dumps(payload))
            except Exception as e:
                logger.debug(f"[MQTTBusAdapter] Failed to publish over wire: {e}")
