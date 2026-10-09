import pytest
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from common.bus import MQTTBus, TOPICS

def test_mqtt_bus_subscription_and_publish():
    bus = MQTTBus()
    received = []
    
    def on_transcript(data):
        received.append(data)
        
    bus.subscribe(TOPICS["TRANSCRIPT"], on_transcript)
    bus.publish(TOPICS["TRANSCRIPT"], {"transcript": "Hey companion", "confidence": 0.98})
    
    assert len(received) == 1
    assert received[0]["transcript"] == "Hey companion"
