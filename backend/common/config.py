"""
Central Configuration Loader for Settings & Calibration
"""

import os
import yaml
from typing import Dict, Any

class ConfigManager:
    def __init__(self, config_dir: str = None):
        if config_dir is None:
            config_dir = os.path.join(os.path.dirname(__file__), "..", "storage", "config")
        self.config_dir = os.path.abspath(config_dir)
        self.settings = self._load("settings.yaml")
        self.calibration = self._load("calibration.yaml")

    def _load(self, filename: str) -> Dict[str, Any]:
        path = os.path.join(self.config_dir, filename)
        if not os.path.exists(path):
            return {}
        try:
            with open(path, "r") as f:
                return yaml.safe_load(f) or {}
        except Exception as e:
            print(f"[ConfigManager] Error loading {filename}: {e}")
            return {}

    def get_setting(self, path_str: str, default: Any = None) -> Any:
        keys = path_str.split(".")
        val = self.settings
        for k in keys:
            if isinstance(val, dict) and k in val:
                val = val[k]
            else:
                return default
        return val
