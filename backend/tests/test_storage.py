import pytest
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from storage.storage_service import StorageService

def test_storage_service_init_and_logs(tmp_path):
    storage = StorageService(config_dir=os.path.join(os.path.dirname(__file__), "..", "storage", "config"), db_name="test_session.db")
    assert storage.settings is not None
    assert storage.calibration is not None

    storage.log_interaction("user", "chat", "Test question")
    history = storage.get_recent_history(limit=5)
    assert len(history) > 0
    assert history[-1]["content"] == "Test question"
