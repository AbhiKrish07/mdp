"""
Shared MQTT Message Bus Wrapper using Paho MQTT Client
Manages topics, callbacks, reconnection, and graceful fallback queues.
"""

import json
import logging
from typing import Callable, Dict, Any, Optional, List

import sys
import os

_mdp_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
_paho_src = os.path.join(_mdp_root, "paho.mqtt.python-master", "src")
if os.path.exists(_paho_src) and _paho_src not in sys.path:
    sys.path.insert(0, _paho_src)

try:
    import paho.mqtt.client as mqtt  # type: ignore[import-not-found]
    HAS_PAHO = True
except (ImportError, ModuleNotFoundError):
    HAS_PAHO = False

logger = logging.getLogger("MQTTBus")

TOPICS = {
    "TRANSCRIPT": "robot/audio/transcript",
    "VISION_REQ": "robot/vision/request",
    "VISION_RES": "robot/vision/result",
    "RESPONSE": "robot/assistant/response",
    "STATE": "robot/assistant/state",
    "HW_CMD": "robot/hardware/command",
    "HW_TELEMETRY": "robot/hardware/telemetry",
    "HEALTH": "robot/system/health"
}

class MQTTBus:
    def __init__(self, host: str = "localhost", port: int = 1883, client_id: str = "ai_companion"):
        self.host = host
        self.port = port
        self.client_id = client_id
        self.callbacks: Dict[str, List[Callable]] = {}
        self.connected = False
        
        if HAS_PAHO:
            self.client = mqtt.Client(client_id=client_id, clean_session=True)
            self.client.on_connect = self._on_connect
            self.client.on_disconnect = self._on_disconnect
            self.client.on_message = self._on_message
        else:
            self.client = None
            logger.warning("[MQTTBus] Paho-MQTT package not installed. Running in mock local memory bus mode.")

    def connect(self):
        """Connect to local Mosquitto broker."""
        if not HAS_PAHO or not self.client:
            return
        try:
            self.client.connect_async(self.host, self.port, keepalive=60)
            self.client.loop_start()
        except Exception as e:
            logger.error(f"[MQTTBus] Broker connection failed: {e}. Local fallback enabled.")

    def disconnect(self):
        if HAS_PAHO and self.client:
            self.client.loop_stop()
            self.client.disconnect()

    def _on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            self.connected = True
            logger.info(f"[MQTTBus] Connected to Mosquitto MQTT Broker at {self.host}:{self.port}")
            # Re-subscribe to all registered callback topics
            for topic in self.callbacks.keys():
                self.client.subscribe(topic)
        else:
            logger.error(f"[MQTTBus] MQTT Connection failed with code {rc}")

    def _on_disconnect(self, client, userdata, rc):
        self.connected = False
        logger.warning(f"[MQTTBus] Disconnected from Mosquitto MQTT broker (code {rc}). Retrying...")

    def _on_message(self, client, userdata, msg):
        topic = msg.topic
        try:
            payload = json.loads(msg.payload.decode("utf-8"))
        except Exception:
            payload = {"raw": msg.payload.decode("utf-8", errors="ignore")}
            
        if topic in self.callbacks:
            for cb in self.callbacks[topic]:
                try:
                    cb(payload)
                except Exception as e:
                    logger.error(f"[MQTTBus] Error in callback for {topic}: {e}")

    def subscribe(self, topic: str, callback: Callable[[Dict[str, Any]], None]):
        """Subscribe to an MQTT topic with a callback function."""
        if topic not in self.callbacks:
            self.callbacks[topic] = []
        self.callbacks[topic].append(callback)
        
        if HAS_PAHO and self.client and self.connected:
            self.client.subscribe(topic)

    def publish(self, topic: str, payload: Dict[str, Any]):
        """Publish a JSON payload to an MQTT topic."""
        json_str = json.dumps(payload)
        if HAS_PAHO and self.client and self.connected:
            self.client.publish(topic, json_str)
        else:
            # Dispatch locally to subscribers if offline or in-memory mode
            if topic in self.callbacks:
                for cb in self.callbacks[topic]:
                    cb(payload)
