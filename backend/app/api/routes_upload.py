"""
SENTINEL — Upload Route
POST /api/upload — Accepts video files and returns a session ID for WebSocket streaming.
"""
import uuid
import logging
from pathlib import Path

from fastapi import APIRouter, UploadFile, File, HTTPException

from app.config import UPLOAD_DIR, MAX_UPLOAD_SIZE, ALLOWED_VIDEO_EXTENSIONS

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/api/upload")
async def upload_video(file: UploadFile = File(...)):
    """
    Upload a video file for AI processing.
    Returns a session_id to use for WebSocket connection.
    """
    # Validate file extension
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_VIDEO_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type '{ext}'. Allowed: {', '.join(ALLOWED_VIDEO_EXTENSIONS)}",
        )

    # Generate unique session ID
    session_id = str(uuid.uuid4())[:8]

    # Save uploaded file
    save_path = UPLOAD_DIR / f"{session_id}{ext}"

    try:
        # Read and save file with size check
        total_size = 0
        with open(save_path, "wb") as f:
            while chunk := await file.read(1024 * 1024):  # 1MB chunks
                total_size += len(chunk)
                if total_size > MAX_UPLOAD_SIZE:
                    # Clean up partial file
                    save_path.unlink(missing_ok=True)
                    raise HTTPException(
                        status_code=413,
                        detail=f"File too large. Maximum size: {MAX_UPLOAD_SIZE // (1024*1024)}MB",
                    )
                f.write(chunk)

        logger.info(
            "Video uploaded: session=%s, file=%s, size=%d bytes",
            session_id, file.filename, total_size,
        )

        return {
            "session_id": session_id,
            "filename": file.filename,
            "size_bytes": total_size,
            "video_path": str(save_path),
            "message": "Upload successful. Connect to WebSocket to start processing.",
        }

    except HTTPException:
        raise
    except Exception as e:
        save_path.unlink(missing_ok=True)
        logger.error("Upload failed: %s", e)
        raise HTTPException(status_code=500, detail="Upload failed") from e
