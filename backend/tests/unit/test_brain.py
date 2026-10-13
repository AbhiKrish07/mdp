import pytest
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from services.brain.tool_registry import ToolValidator
from services.brain.groq_client import GroqBrainClient
from services.brain.rules_engine import RulesEngine

def test_tool_validator_allowlist():
    res1 = ToolValidator.validate_and_execute("gesture", {"name": "wave"})
    assert res1["status"] == "approved"
    assert res1["gesture"] == "wave"

    res2 = ToolValidator.validate_and_execute("raw_gpio_write", {"pin": 12})
    assert res2["status"] == "denied"

def test_rules_engine_long_sit():
    engine = RulesEngine(sit_threshold_minutes=90.0)
    engine.session_start = 0.0 # Force threshold breach
    nudge = engine.check_sit_duration()
    assert nudge is not None
    assert nudge["rule"] == "long_sit_break_nudge"
