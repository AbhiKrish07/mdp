"""Standalone project core for the AI Desk Companion.

This file uses only the Python standard library. It replaces project-level
glue and demo logic with one pipeline. Hardware, speech, vision, and AI engines
plug into the small interfaces below after the target devices are selected.

Run a safe text-only demo with: python companion_core.py
"""

from __future__ import annotations

import argparse
import importlib
import json
import os
import sqlite3
import time
from dataclasses import asdict, dataclass, field
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any, Optional, Protocol


EXPRESSIONS = {"idle", "listening", "thinking", "speaking", "happy", "alert"}
GESTURES = {"neutral", "wave", "point", "nudge"}


@dataclass
class DeviceState:
    connected: bool = False
    privacy_active: bool = False
    edge_detected: bool = False
    sensors: dict[str, float | bool | str] = field(default_factory=dict)


@dataclass
class PerceptionResult:
    text: str
    vision_summary: Optional[str] = None
    confidence: float = 1.0


@dataclass
class Decision:
    speech: str
    expression: str = "speaking"
    gesture: str = "neutral"


class HardwarePort(Protocol):
    """Implement this port for the physical device selected later."""

    def read_state(self) -> DeviceState: ...
    def capture_image(self) -> Optional[bytes]: ...
    def read_audio(self) -> Optional[bytes]: ...
    def set_privacy(self, active: bool) -> None: ...
    def set_expression(self, expression: str) -> None: ...
    def perform_gesture(self, gesture: str) -> None: ...
    def stop_motion(self) -> None: ...
    def speak(self, text: str) -> None: ...
    def close(self) -> None: ...


class PerceptionPort(Protocol):
    def process(self, text: str, image: Optional[bytes] = None,
                audio: Optional[bytes] = None) -> PerceptionResult: ...


class ReasoningPort(Protocol):
    def respond(self, input_data: PerceptionResult,
                history: list[dict[str, str]]) -> Decision: ...


class SimulationHardware:
    """Dry-run device. It never opens a port or controls real equipment."""

    def __init__(self) -> None:
        self.privacy_active = False
        self.expression = "idle"
        self.gesture = "neutral"

    def read_state(self) -> DeviceState:
        return DeviceState(connected=False, privacy_active=self.privacy_active)

    def capture_image(self) -> Optional[bytes]:
        return None

    def read_audio(self) -> Optional[bytes]:
        return None

    def set_privacy(self, active: bool) -> None:
        self.privacy_active = bool(active)

    def set_expression(self, expression: str) -> None:
        self.expression = expression

    def perform_gesture(self, gesture: str) -> None:
        self.gesture = gesture

    def stop_motion(self) -> None:
        pass

    def speak(self, text: str) -> None:
        print(f"Companion: {text}")

    def close(self) -> None:
        pass


class BasicPerception:
    """Text-only fallback; replace with speech/vision implementations later."""

    def process(self, text: str, image: Optional[bytes] = None,
                audio: Optional[bytes] = None) -> PerceptionResult:
        del image, audio
        return PerceptionResult(text=text.strip())


class BasicReasoner:
    """Small deterministic fallback so the core runs without an AI package."""

    def respond(self, input_data: PerceptionResult,
                history: list[dict[str, str]]) -> Decision:
        del history
        query = input_data.text.lower()
        if input_data.vision_summary:
            return Decision(f"Here is what I understood: {input_data.vision_summary}",
                            "thinking", "point")
        if any(word in query for word in ("hello", "hi", "hey")):
            return Decision("Hello! What are you working on?", "happy", "wave")
        if any(word in query for word in ("break", "stretch", "tired")):
            return Decision("A short stretch break might help.", "happy", "nudge")
        return Decision(f"I heard: {input_data.text}", "speaking", "neutral")


def hardware_from_environment() -> HardwarePort:
    """Load hardware adapter from environment or use UniversalHardwareAdapter by default."""
    spec = os.getenv("COMPANION_HARDWARE_ADAPTER", "universal").strip()
    if spec in ("simulation", "dry-run"):
        return SimulationHardware()
    if spec in ("", "universal"):
        try:
            from hal.adapter import UniversalHardwareAdapter
            return UniversalHardwareAdapter()
        except Exception:
            return SimulationHardware()
    if ":" not in spec:
        raise ValueError("Set COMPANION_HARDWARE_ADAPTER to 'universal', 'simulation', or 'module:Class'")
    module_name, class_name = spec.split(":", 1)
    adapter_type = getattr(importlib.import_module(module_name), class_name)
    adapter = adapter_type()
    methods = ("read_state", "capture_image", "read_audio", "set_privacy",
               "set_expression", "perform_gesture", "stop_motion", "speak", "close")
    missing = [method for method in methods if not callable(getattr(adapter, method, None))]
    if missing:
        raise TypeError(f"Hardware adapter missing methods: {', '.join(missing)}")
    return adapter


class CompanionCore:
    """Owns privacy, safety, history, and the end-to-end interaction flow."""

    def __init__(self, hardware: Optional[HardwarePort] = None,
                 perception: Optional[PerceptionPort] = None,
                 reasoner: Optional[ReasoningPort] = None,
                 database: Optional[str] = None) -> None:
        self.hardware = hardware or hardware_from_environment()
        
        # Default to Universal HAL perception & reasoning if available
        if perception is None:
            try:
                from hal.adapter import UniversalPerceptionAdapter
                self.perception = UniversalPerceptionAdapter()
            except Exception:
                self.perception = BasicPerception()
        else:
            self.perception = perception

        if reasoner is None:
            try:
                from hal.adapter import UniversalReasoningAdapter
                self.reasoner = UniversalReasoningAdapter()
            except Exception:
                self.reasoner = BasicReasoner()
        else:
            self.reasoner = reasoner

        self.database = database or os.getenv("COMPANION_DB", "companion_history.sqlite3")
        self._initialize_database()
        self.started_at = time.monotonic()

    def _initialize_database(self) -> None:
        with sqlite3.connect(self.database) as connection:
            connection.execute("""CREATE TABLE IF NOT EXISTS interactions (
                id INTEGER PRIMARY KEY, created_at REAL NOT NULL,
                role TEXT NOT NULL, content TEXT NOT NULL, metadata TEXT NOT NULL
            )""")

    def _log(self, role: str, content: str, metadata: Optional[dict[str, Any]] = None) -> None:
        with sqlite3.connect(self.database) as connection:
            connection.execute(
                "INSERT INTO interactions(created_at, role, content, metadata) VALUES (?, ?, ?, ?)",
                (time.time(), role, content, json.dumps(metadata or {})),
            )

    def history(self, limit: int = 10) -> list[dict[str, str]]:
        limit = max(1, min(int(limit), 100))
        with sqlite3.connect(self.database) as connection:
            rows = connection.execute(
                "SELECT role, content FROM interactions ORDER BY id DESC LIMIT ?", (limit,)
            ).fetchall()
        return [{"role": role, "content": content} for role, content in reversed(rows)]

    def recent_history(self, limit: int = 15) -> list[dict[str, Any]]:
        limit = max(1, min(int(limit), 100))
        with sqlite3.connect(self.database) as connection:
            connection.row_factory = sqlite3.Row
            rows = connection.execute(
                "SELECT created_at, role, content, metadata FROM interactions ORDER BY id DESC LIMIT ?",
                (limit,),
            ).fetchall()
        return [dict(row) for row in reversed(rows)]

    def set_privacy(self, active: bool) -> dict[str, Any]:
        self.hardware.set_privacy(active)
        if active:
            # The software requests a stop; the hardware adapter must implement
            # an independent physical safety cutoff for production hardware.
            self.hardware.stop_motion()
        return {"privacy_active": bool(active), "device": self.hardware.read_state().connected}

    def handle(self, text: str, include_image: bool = False) -> dict[str, Any]:
        state = self.hardware.read_state()
        if state.privacy_active:
            return {"status": "privacy_blocked", "message": "Privacy mode is active."}

        image = self.hardware.capture_image() if include_image else None
        audio = self.hardware.read_audio() if not text.strip() else None
        observed = self.perception.process(text, image=image, audio=audio)
        decision = self.reasoner.respond(observed, self.history())

        # Fail closed on unsafe or unknown output labels.
        expression = decision.expression if decision.expression in EXPRESSIONS else "speaking"
        gesture = decision.gesture if decision.gesture in GESTURES else "neutral"
        if state.edge_detected:
            self.hardware.stop_motion()
            gesture = "neutral"

        self.hardware.set_expression(expression)
        self.hardware.perform_gesture(gesture)
        self.hardware.speak(decision.speech)
        self._log("user", observed.text)
        self._log("assistant", decision.speech,
                   {"expression": expression, "gesture": gesture})
        return {
            "status": "ok", "input": observed.text, "reply": decision.speech,
            "expression": expression, "gesture": gesture,
            "hardware_connected": state.connected,
            "hardware_adapter": type(self.hardware).__name__,
        }

    def status(self) -> dict[str, Any]:
        state = self.hardware.read_state()
        return {"hardware": asdict(state), "uptime_seconds": round(time.monotonic() - self.started_at, 1)}

    def close(self) -> None:
        self.hardware.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="Hardware-neutral companion core")
    parser.add_argument("--query", default="Hello companion")
    parser.add_argument("--image", action="store_true", help="Request an image from the selected adapter")
    parser.add_argument("--privacy", choices=("on", "off"))
    parser.add_argument("--api", action="store_true", help="Serve the local simulator API")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8088)
    args = parser.parse_args()

    core = CompanionCore()
    try:
        if args.api:
            serve(core, args.host, args.port)
        elif args.privacy:
            print(json.dumps(core.set_privacy(args.privacy == "on"), indent=2))
        else:
            print(json.dumps(core.handle(args.query, include_image=args.image), indent=2))
    finally:
        core.close()


def serve(core: CompanionCore, host: str = "127.0.0.1", port: int = 8088) -> None:
    """Small standard-library API compatible with the companion simulator."""
    class Handler(BaseHTTPRequestHandler):
        def _send(self, status: int, data: dict[str, Any]) -> None:
            body = json.dumps(data).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Headers", "Content-Type")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            self.end_headers()
            self.wfile.write(body)

        def do_OPTIONS(self) -> None:
            self._send(200, {"ok": True})

        def do_GET(self) -> None:
            if self.path == "/":
                status = core.status()
                self._send(200, {"status": "online", "device": "AI Desk Companion",
                                 "privacy_mode": status["hardware"]["privacy_active"],
                                 "face_state": getattr(core.hardware, "expression", "idle"),
                                 "hardware_connected": status["hardware"]["connected"]})
            elif self.path.startswith("/api/history"):
                self._send(200, {"history": core.recent_history()})
            elif self.path == "/api/sit-status":
                uptime = core.status()["uptime_seconds"]
                sit_mins = uptime / 60.0
                nudge = None
                if hasattr(core.reasoner, "focus_monitor"):
                    nudge = core.reasoner.focus_monitor.evaluate(sit_mins)
                self._send(200, {
                    "uptime_seconds": uptime,
                    "sit_minutes": round(sit_mins, 1),
                    "triggered": nudge is not None,
                    "nudge": nudge,
                })
            else:
                self._send(404, {"error": "not_found"})

        def do_POST(self) -> None:
            try:
                length = int(self.headers.get("Content-Length", "0"))
                if length > 1_000_000:
                    self._send(413, {"error": "request_too_large"})
                    return
                payload = json.loads(self.rfile.read(length) or b"{}")
                if self.path == "/api/query":
                    query = str(payload.get("query", ""))
                    vision_context = payload.get("vision_context")
                    if vision_context:
                        query += "\nVisual context: " + str(vision_context)
                    result = core.handle(query, include_image=bool(payload.get("capture_image", False)))
                    self._send(200, {
                        "status": result["status"], "user_query": result.get("input", query),
                        "assistant_reply": result.get("reply", result.get("message", "")),
                        "expression": result.get("expression", "idle"),
                        "gesture": result.get("gesture", "neutral"),
                        "hardware_connected": result.get("hardware_connected", False),
                    })
                elif self.path == "/api/privacy":
                    result = core.set_privacy(bool(payload.get("privacy_active", False)))
                    self._send(200, result)
                else:
                    self._send(404, {"error": "not_found"})
            except (ValueError, TypeError, json.JSONDecodeError) as exc:
                self._send(400, {"error": "invalid_request", "detail": str(exc)})

        def log_message(self, format: str, *args: Any) -> None:
            print("[api] " + format % args)

    server = ThreadingHTTPServer((host, port), Handler)
    print(f"Companion API listening on http://{host}:{port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
