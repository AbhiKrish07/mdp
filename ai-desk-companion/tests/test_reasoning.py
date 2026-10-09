import pytest
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from reasoning.reasoning_service import ReasoningService

def test_reasoning_dual_mode():
    reasoning = ReasoningService()
    res = reasoning.process_query("What is on my desk?")
    assert "response" in res
    assert res["expression"] in ["idle", "listening", "thinking", "speaking", "happy", "alert", "nudge"]
    assert res["gesture"] in ["neutral", "wave", "point", "nudge"]

def test_situational_rules_engine():
    reasoning = ReasoningService()
    rule = reasoning.evaluate_situational_rules(95.0) # 95 minutes sit duration
    assert rule is not None
    assert rule["triggered_rule"] == "long_sit_break_reminder"
