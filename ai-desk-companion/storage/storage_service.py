"""
Storage Layer Service
Handles local session logging, configuration loading, calibration parameters, and SQLite persistence.
"""

import os
import sqlite3
import yaml
from datetime import datetime
from typing import Dict, Any, List, Optional

class StorageService:
    def __init__(self, config_dir: str = None, db_name: str = "ai_companion_session.db"):
        if config_dir is None:
            config_dir = os.path.join(os.path.dirname(__file__), "config")
        
        self.config_dir = config_dir
        self.db_path = os.path.join(os.path.dirname(__file__), db_name)
        
        self.settings = self._load_yaml("settings.yaml")
        self.calibration = self._load_yaml("calibration.yaml")
        
        self._init_db()

    def _load_yaml(self, filename: str) -> Dict[str, Any]:
        filepath = os.path.join(self.config_dir, filename)
        if not os.path.exists(filepath):
            return {}
        try:
            with open(filepath, "r") as f:
                return yaml.safe_load(f) or {}
        except Exception as e:
            print(f"[StorageService] Warning: Failed to load {filename}: {e}")
            return {}

    def _init_db(self):
        """Initialize SQLite database for session logs and context memory."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Sessions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                start_time TEXT NOT NULL,
                end_time TEXT,
                total_duration_sec INTEGER DEFAULT 0,
                sit_check_count INTEGER DEFAULT 0
            )
        """)
        
        # Interactions table (chats, vision scans, nudges)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS interactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                role TEXT NOT NULL,
                type TEXT NOT NULL, -- 'chat', 'vision', 'break_nudge', 'gesture'
                content TEXT NOT NULL,
                metadata TEXT
            )
        """)
        
        conn.commit()
        conn.close()

    def log_interaction(self, role: str, interaction_type: str, content: str, metadata: str = ""):
        """Log a new user/assistant interaction or vision scan event."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        now = datetime.now().isoformat()
        cursor.execute(
            "INSERT INTO interactions (timestamp, role, type, content, metadata) VALUES (?, ?, ?, ?, ?)",
            (now, role, interaction_type, content, metadata)
        )
        conn.commit()
        conn.close()

    def get_recent_history(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Retrieve recent interaction logs for context memory."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute(
            "SELECT timestamp, role, type, content, metadata FROM interactions ORDER BY id DESC LIMIT ?",
            (limit,)
        )
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in reversed(rows)]

    def get_setting(self, category: str, key: str, default: Any = None) -> Any:
        return self.settings.get(category, {}).get(key, default)

    def get_calibration(self, subsystem: str, key: str, default: Any = None) -> Any:
        return self.calibration.get(subsystem, {}).get(key, default)
