import pytest
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sensing.sensing_service import SensingService
from perception.perception_service import PerceptionService

def test_perception_wake_word_and_vision():
    sensing = SensingService()
    perception = PerceptionService(sensing_service=sensing)

    assert perception.detect_wake_word() == True
    
    stt_text = perception.process_speech_to_text(text_override="Explain this component")
    assert stt_text == "Explain this component"

    vision_res = perception.analyze_vision_target(prompt="What resistor is this?")
    assert vision_res["success"] == True
    assert "summary" in vision_res
