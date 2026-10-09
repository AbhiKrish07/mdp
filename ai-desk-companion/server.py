"""
AI Desk Companion - REST & WebSocket API Server (FastAPI)
Provides live HTTP & WebSocket endpoints connecting the Python backend to the Web Simulator UI.
"""

from fastapi import FastAPI, HTTPException, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
import asyncio
import os

from main import AIDeskCompanion

app = FastAPI(title="AI Desk Companion API", version="1.0.0")

# Enable CORS for Web Simulator frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

companion = AIDeskCompanion()

class QueryRequest(BaseModel):
    query: str
    vision_context: Optional[str] = None
    image_base64: Optional[str] = None
    api_key: Optional[str] = None

class PrivacyRequest(BaseModel):
    privacy_active: bool

@app.get("/")
def read_root():
    return {
        "status": "online",
        "device": "AI Desk Companion",
        "privacy_mode": companion.sensing.privacy_switch_active,
        "face_state": companion.action.face_state
    }

@app.post("/api/query")
async def process_query(req: QueryRequest):
    if req.api_key:
        companion.reasoning.api_key = req.api_key
        
    res = await companion.run_interaction_loop(
        text_input=req.query,
        vision_image=req.image_base64 or req.vision_context
    )
    return res

@app.post("/api/privacy")
def set_privacy(req: PrivacyRequest):
    state = companion.sensing.toggle_privacy_switch(req.privacy_active)
    return {"privacy_active": state}

@app.get("/api/history")
def get_history(limit: int = 15):
    return companion.storage.get_recent_history(limit=limit)

@app.get("/api/sit-status")
async def get_sit_status():
    return await companion.check_sit_timer_rule()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8088)
