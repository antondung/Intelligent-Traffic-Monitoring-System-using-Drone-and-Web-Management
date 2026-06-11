"""
SENTINEL — WebSocket Route
WS /ws/live/{session_id} — Streams processed frames and detection data.
"""
import asyncio
import logging
from pathlib import Path

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.config import UPLOAD_DIR, HARD_DEBUG_MODE
from app.services.websocket_manager import ws_manager
from app.services.video_processor import (
    VideoProcessor,
    register_processor,
    remove_processor,
)

logger = logging.getLogger(__name__)
router = APIRouter()


@router.websocket("/ws/live/{session_id}")
async def websocket_live(websocket: WebSocket, session_id: str):
    """
    WebSocket endpoint for real-time video processing.
    Client connects with a session_id obtained from POST /api/upload.
    Server processes the uploaded video and streams frames + detections.
    """
    # Accept WebSocket connection
    await websocket.accept()
    logger.info("WebSocket connected for session: %s", session_id)
    ws_manager.register(session_id, websocket)

    # Find the uploaded video file
    video_path = None
    for ext in [".mp4", ".avi", ".mov", ".mkv", ".wmv"]:
        candidate = UPLOAD_DIR / f"{session_id}{ext}"
        if candidate.exists():
            video_path = str(candidate)
            break

    if video_path is None:
        logger.error("No video found for session: %s", session_id)
        try:
            await websocket.send_json({
                "type": "error",
                "message": f"No video found for session: {session_id}",
            })
            await websocket.close()
        except Exception:
            pass
        ws_manager.unregister(session_id)
        return

    # Create and register processor
    processor = VideoProcessor(session_id, video_path, websocket)
    register_processor(session_id, processor)

    async def listen_client():
        try:
            while True:
                data = await websocket.receive_text()
                if not data:
                    break
                if data == "stop":
                    logger.info("Received stop request from client for session: %s", session_id)
                    processor.stop()
                    break
                elif data == "enable_overlay":
                    logger.info("Enabling AI overlay dynamically for session: %s", session_id)
                    processor.ai_overlay = True
                elif data == "disable_overlay":
                    logger.info("Disabling AI overlay dynamically for session: %s", session_id)
                    processor.ai_overlay = False
        except WebSocketDisconnect:
            logger.info("Client WebSocket disconnected during listener for session: %s", session_id)
            processor.stop()
        except Exception as e:
            if HARD_DEBUG_MODE:
                print(f"[WS LISTEN ERROR] {e}", flush=True)
            processor.stop()

    # Spawn background listener task to accept client actions without blocking the frame loop
    listener_task = asyncio.create_task(listen_client())

    try:
        # Send initial status
        await websocket.send_json({
            "type": "processing_started",
            "session_id": session_id,
            "message": "AI pipeline initialized. Processing video...",
        })

        # Run processing loop directly
        await processor.process()

    except WebSocketDisconnect:
        logger.info("WebSocket disconnected for session: %s", session_id)
    except Exception as e:
        logger.error("WebSocket coordinator error for session %s: %s", session_id, e, exc_info=True)
        if HARD_DEBUG_MODE:
            import traceback
            traceback.print_exc()
    finally:
        logger.info("Session %s connection closed, cleaning up resources", session_id)
        # Cancel the listener task to prevent task leaks
        listener_task.cancel()
        try:
            await listener_task
        except asyncio.CancelledError:
            pass
        except Exception:
            pass
        processor.stop()
        remove_processor(session_id)
        ws_manager.unregister(session_id)
