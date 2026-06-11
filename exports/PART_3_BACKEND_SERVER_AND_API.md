# PHẦN 3: BACKEND / SERVER & API

Bao gồm cấu trúc và toàn bộ mã nguồn FastAPI Backend ứng dụng:
- Khởi tạo server, đăng ký WebSocket, REST routes.
- Các API endpoints cho upload, WebSocket, healthcheck, config.
- Module tiện ích cho xử lý hình ảnh, hình học không gian (polygon, line crossing) và video.

---

FILE: backend/app/__init__.py

```python
# app package

```

---
FILE: backend/app/main.py

```python
"""
SENTINEL Backend — FastAPI Application
Main application factory with CORS, routing, and startup model preloading.
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import CORS_ORIGINS
from app.api.routes_health import router as health_router
from app.api.routes_upload import router as upload_router
from app.api.routes_websocket import router as ws_router

# ── Logging Setup ────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)


# ── Lifespan: Preload AI Models on Startup ───────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load AI models at startup so first request isn't slow."""
    logger.info("=" * 60)
    logger.info("SENTINEL Backend — Starting Up")
    logger.info("=" * 60)

    # Validate model files exist (downloads plate model if missing)
    from app.config import validate_model_path, PYTORCH_AVAILABLE
    if PYTORCH_AVAILABLE:
        try:
            validate_model_path()
            logger.info("✓ Model files validated: best.pt and plate_detector.pt found")
        except FileNotFoundError as e:
            logger.critical("✗ FATAL SHUTDOWN: Model validation failed: %s", e)
            raise SystemExit(f"FATAL MODEL VALIDATION ERROR: {e}")

        # Preload YOLO model
        try:
            from app.services.yolo_service import yolo_service
            yolo_service.load_model()
            logger.info("✓ YOLO vehicle model loaded")
        except Exception as e:
            logger.error("✗ Failed to load YOLO vehicle model: %s", e)
            raise SystemExit(f"FATAL: Failed to load YOLO vehicle model: {e}")

        # Preload YOLO plate detector model
        try:
            from app.services.plate_detector import plate_detector_service
            plate_detector_service.load_model()
            logger.info("✓ Plate detector model loaded")
        except Exception as e:
            logger.error("✗ Failed to load Plate detector model: %s", e)
            raise SystemExit(f"FATAL: Failed to load Plate detector model: {e}")

        # Preload EasyOCR
        try:
            from app.services.ocr_service import ocr_service
            ocr_service.load_model()
            logger.info("✓ EasyOCR loaded")
        except Exception as e:
            logger.warning("✗ Failed to load EasyOCR (will retry on first use): %s", e)
    else:
        logger.warning("⚠️ Running in Graceful CV Fallback Mode. Skipping PyTorch/YOLO/EasyOCR preloading.")

    logger.info("=" * 60)
    logger.info("SENTINEL Backend — Ready")
    logger.info("=" * 60)

    yield  # Application runs

    # Shutdown cleanup
    logger.info("SENTINEL Backend — Shutting Down")


# ── Create FastAPI App ───────────────────────────────────
app = FastAPI(
    title="SENTINEL — Smart Traffic AI Backend",
    description="Real-time traffic monitoring with YOLOv8, ByteTrack, EasyOCR",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS Middleware ──────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Include Routers ─────────────────────────────────────
app.include_router(health_router)
app.include_router(upload_router)
app.include_router(ws_router)

# ── Mount Static Files ──────────────────────────────────
from fastapi.staticfiles import StaticFiles
from app.config import UPLOAD_DIR
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")


@app.get("/")
async def root():
    return {
        "name": "SENTINEL Backend",
        "version": "1.0.0",
        "docs": "/docs",
    }

```

---
FILE: backend/app/config.py

```python
"""
SENTINEL Backend — Configuration
All configurable parameters for the AI pipeline.

IMPORTANT: This system requires a custom-trained YOLOv8 model (best.pt).
No COCO pretrained fallback is provided. Place your model at backend/models/best.pt.
"""
import os
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

# Check if PyTorch can be imported without crashing
PYTORCH_AVAILABLE = False
try:
    import torch
    # Perform a simple check to ensure c10.dll is actually functional
    _ = torch.__version__
    PYTORCH_AVAILABLE = True
    logger.info("✓ PyTorch is fully functional and available.")
except (ImportError, OSError) as e:
    PYTORCH_AVAILABLE = False
    logger.warning("⚠️ PyTorch is NOT available (DLL initialization error or not installed). Graceful CV fallback will be used: %s", e)

# Hard debug mode to output deep telemetry and complete stack traces
HARD_DEBUG_MODE = True


# ── Paths ────────────────────────────────────────────────
APP_DIR = Path(__file__).resolve().parent
BACKEND_DIR = APP_DIR.parent  # backend/
MODEL_DIR = BACKEND_DIR / "models"
OUTPUT_DIR = BACKEND_DIR / "outputs"
UPLOAD_DIR = BACKEND_DIR / "uploads"

# Ensure directories exist
MODEL_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# ── YOLO Model ───────────────────────────────────────────
# Path to custom-trained YOLOv8 model — NO COCO FALLBACK.
# The system depends entirely on the user's trained model.
YOLO_MODEL_PATH = str(MODEL_DIR / "best.pt")
PLATE_MODEL_PATH = str(MODEL_DIR / "plate_detector.pt")

def validate_model_path() -> None:
    """Validate that best.pt and plate_detector.pt exist. Called at startup."""
    import urllib.request
    
    # 1. Validate custom vehicle detector (best.pt)
    if not (MODEL_DIR / "best.pt").exists():
        msg = (
            f"Custom YOLO vehicle detection model not found at: {YOLO_MODEL_PATH}\n"
            f"Please place your custom-trained best.pt at: {MODEL_DIR / 'best.pt'}\n"
            f"This system depends entirely on your custom vehicle model."
        )
        logger.error(msg)
        raise FileNotFoundError(msg)
        
    # 2. Validate/Download license plate detector (plate_detector.pt)
    if not (MODEL_DIR / "plate_detector.pt").exists():
        url = "https://huggingface.co/Koushim/yolov8-license-plate-detection/resolve/main/best.pt"
        logger.info("=" * 60)
        logger.info("plate_detector.pt not found locally.")
        logger.info("Downloading pre-trained YOLOv8 license plate detector from Hugging Face...")
        logger.info("URL: %s", url)
        logger.info("Saving to: %s", PLATE_MODEL_PATH)
        logger.info("=" * 60)
        try:
            # Add user-agent header to avoid getting blocked by HF
            req = urllib.request.Request(
                url, 
                headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
            )
            with urllib.request.urlopen(req) as response:
                with open(PLATE_MODEL_PATH, 'wb') as out_file:
                    out_file.write(response.read())
            logger.info("✓ Download complete! saved to %s", PLATE_MODEL_PATH)
        except Exception as e:
            msg = (
                f"License plate detector not found at {PLATE_MODEL_PATH} "
                f"and automatic download failed: {e}\n"
                f"Please manually upload plate_detector.pt to models/ directory."
            )
            logger.error(msg)
            raise FileNotFoundError(msg)

# Confidence threshold for detections (0.0 – 1.0)
YOLO_CONFIDENCE_THRESHOLD = float(os.getenv("YOLO_CONF", "0.20"))

# IOU threshold for NMS
YOLO_IOU_THRESHOLD = float(os.getenv("YOLO_IOU", "0.5"))

# Class name mapping — maps model class names to our canonical names.
# Update this if your custom model uses different class names.
CLASS_NAME_MAP = {
    "car": "car",
    "motorcycle": "motorbike",
    "motorbike": "motorbike",
    "bus": "bus",
    "truck": "truck",
    "person": "person",
    "bicycle": "bicycle",
    "van": "car",
    "tricycle": "motorbike",
}

# ── Tracking (ByteTrack) ────────────────────────────────
TRACKER_MAX_AGE = int(os.getenv("TRACKER_MAX_AGE", "30"))  # frames before dropping track
TRACKER_MIN_HITS = int(os.getenv("TRACKER_MIN_HITS", "3"))  # min detections to confirm track

# ── OCR ──────────────────────────────────────────────────
OCR_LANGUAGES = ["en"]  # EasyOCR language list
OCR_CONFIDENCE_THRESHOLD = float(os.getenv("OCR_CONF", "0.3"))
# Run OCR every N frames per tracked vehicle to avoid overhead
OCR_FRAME_INTERVAL = int(os.getenv("OCR_INTERVAL", "15"))

# ── Video Processing ─────────────────────────────────────
MAX_FPS = int(os.getenv("MAX_FPS", "25"))  # target output FPS for WebSocket streaming
FRAME_RESIZE_WIDTH = int(os.getenv("FRAME_WIDTH", "960"))  # resize frames for faster processing
JPEG_QUALITY = int(os.getenv("JPEG_QUALITY", "65"))  # JPEG compression quality for base64 frames

# ── Violation Detection ──────────────────────────────────
# Virtual lane boundary line: defined as two points [(x1,y1), (x2,y2)]
# normalized to 0-1 range relative to frame dimensions.
# Objects crossing from right-to-left of this line are "wrong lane".
VIOLATION_LANE_LINE = [
    (0.5, 0.0),   # top-center
    (0.5, 1.0),   # bottom-center
]

# Allowed movement direction vector (normalized).
# Vehicles moving opposite to this vector trigger "opposite direction" violation.
# Default: top-to-bottom (positive Y direction)
ALLOWED_DIRECTION = (0.0, 1.0)

# Minimum displacement (in pixels) before checking direction
DIRECTION_MIN_DISPLACEMENT = 30

# ── Server ───────────────────────────────────────────────
CORS_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# Max upload file size (bytes) — 500MB
MAX_UPLOAD_SIZE = 500 * 1024 * 1024
ALLOWED_VIDEO_EXTENSIONS = {".mp4", ".avi", ".mov", ".mkv", ".wmv"}

```

---
FILE: backend/app/api/__init__.py

```python
# api package

```

---
FILE: backend/app/api/routes_health.py

```python
"""
SENTINEL — Health Check Route
GET /api/health — Returns backend status, model state, GPU availability.
"""
from fastapi import APIRouter

from app.config import PYTORCH_AVAILABLE
from app.services.yolo_service import yolo_service
from app.services.ocr_service import ocr_service
from app.services.websocket_manager import ws_manager

router = APIRouter()


@router.get("/api/health")
async def health_check():
    """Return backend health status including model and GPU info."""
    gpu_available = False
    gpu_name = None
    
    if PYTORCH_AVAILABLE:
        try:
            import torch
            gpu_available = torch.cuda.is_available()
            gpu_name = torch.cuda.get_device_name(0) if gpu_available else None
        except Exception:
            pass

    return {
        "status": "ok",
        "models": {
            "yolo_loaded": yolo_service.is_loaded,
            "ocr_loaded": ocr_service.is_loaded,
        },
        "gpu": {
            "available": gpu_available,
            "device": gpu_name,
        },
        "websocket": {
            "active_connections": ws_manager.active_connections,
        },
    }

```

---
FILE: backend/app/api/routes_upload.py

```python
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

```

---
FILE: backend/app/api/routes_websocket.py

```python
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

```

---
FILE: backend/app/utils/__init__.py

```python
# utils package

```

---
FILE: backend/app/utils/geometry_utils.py

```python
"""
SENTINEL — Geometry Utilities
Spatial computations for violation detection.
"""
import math


def centroid_from_bbox(bbox: dict) -> tuple[float, float]:
    """Compute centroid from a bounding box dict with x1, y1, x2, y2."""
    cx = (bbox["x1"] + bbox["x2"]) / 2.0
    cy = (bbox["y1"] + bbox["y2"]) / 2.0
    return (cx, cy)


def point_side_of_line(
    point: tuple[float, float],
    line_start: tuple[float, float],
    line_end: tuple[float, float],
) -> float:
    """
    Determine which side of a line a point is on using cross product.
    Returns positive if point is on the left, negative if on the right.
    """
    return (
        (line_end[0] - line_start[0]) * (point[1] - line_start[1])
        - (line_end[1] - line_start[1]) * (point[0] - line_start[0])
    )


def line_crossing_detected(
    prev_pos: tuple[float, float],
    curr_pos: tuple[float, float],
    line_start: tuple[float, float],
    line_end: tuple[float, float],
) -> bool:
    """
    Check if movement from prev_pos to curr_pos crosses a line segment.
    Returns True if the two positions are on different sides of the line.
    """
    side_prev = point_side_of_line(prev_pos, line_start, line_end)
    side_curr = point_side_of_line(curr_pos, line_start, line_end)
    # Different signs = crossed the line
    return (side_prev * side_curr) < 0


def direction_vector(
    prev_pos: tuple[float, float],
    curr_pos: tuple[float, float],
) -> tuple[float, float]:
    """Compute the direction vector between two positions."""
    dx = curr_pos[0] - prev_pos[0]
    dy = curr_pos[1] - prev_pos[1]
    return (dx, dy)


def vector_magnitude(v: tuple[float, float]) -> float:
    """Compute the magnitude of a 2D vector."""
    return math.sqrt(v[0] ** 2 + v[1] ** 2)


def normalize_vector(v: tuple[float, float]) -> tuple[float, float]:
    """Normalize a 2D vector to unit length."""
    mag = vector_magnitude(v)
    if mag == 0:
        return (0.0, 0.0)
    return (v[0] / mag, v[1] / mag)


def dot_product(v1: tuple[float, float], v2: tuple[float, float]) -> float:
    """Compute the dot product of two 2D vectors."""
    return v1[0] * v2[0] + v1[1] * v2[1]

```

---
FILE: backend/app/utils/image_utils.py

```python
"""
SENTINEL — Image Utilities
Frame encoding/decoding, resizing, and JPEG optimization.
"""
import base64

import cv2
import numpy as np

from app.config import JPEG_QUALITY, FRAME_RESIZE_WIDTH


def frame_to_base64(frame: np.ndarray, quality: int = JPEG_QUALITY) -> str:
    """Encode an OpenCV frame to base64 JPEG string with strict validation."""
    if frame is None:
        raise ValueError("Frame is None")
    if not isinstance(frame, np.ndarray):
        raise TypeError(f"Frame must be a numpy.ndarray, got {type(frame)}")
    if frame.size == 0:
        raise ValueError("Frame size is 0 (empty array)")
    if len(frame.shape) < 2 or frame.shape[0] <= 0 or frame.shape[1] <= 0:
        raise ValueError(f"Frame has invalid dimensions: {frame.shape}")

    encode_params = [int(cv2.IMWRITE_JPEG_QUALITY), quality]
    success, buffer = cv2.imencode(".jpg", frame, encode_params)
    if not success:
        raise RuntimeError("cv2.imencode failed to compress the frame to JPEG format")
    return base64.b64encode(buffer).decode("utf-8")


def resize_frame(frame: np.ndarray, target_width: int = FRAME_RESIZE_WIDTH) -> np.ndarray:
    """Resize frame while maintaining aspect ratio."""
    h, w = frame.shape[:2]
    if w <= target_width:
        return frame
    ratio = target_width / w
    new_h = int(h * ratio)
    return cv2.resize(frame, (target_width, new_h), interpolation=cv2.INTER_AREA)


def crop_bbox(frame: np.ndarray, bbox: dict, padding: int = 10) -> np.ndarray | None:
    """
    Crop a bounding box region from a frame with optional padding.
    Returns None if the crop is too small or invalid.
    """
    h, w = frame.shape[:2]
    x1 = max(0, bbox["x1"] - padding)
    y1 = max(0, bbox["y1"] - padding)
    x2 = min(w, bbox["x2"] + padding)
    y2 = min(h, bbox["y2"] + padding)

    if x2 - x1 < 20 or y2 - y1 < 20:
        return None

    return frame[y1:y2, x1:x2].copy()


def draw_detections(
    frame: np.ndarray,
    detections: list[dict],
) -> np.ndarray:
    """
    Draw bounding boxes, labels, and track IDs on the frame.
    This creates the annotated frame sent to the frontend.
    """
    annotated = frame.copy()

    color_map = {
        "car": (255, 212, 0),       # Cyan (BGR)
        "motorbike": (247, 85, 168), # Purple (BGR)
        "truck": (11, 158, 245),     # Amber (BGR)
        "bus": (78, 197, 34),        # Green (BGR)
    }

    for det in detections:
        bbox = det["bbox"]
        x1, y1, x2, y2 = bbox["x1"], bbox["y1"], bbox["x2"], bbox["y2"]
        cls_name = det.get("class", "unknown")
        confidence = det.get("confidence", 0)
        track_id = det.get("track_id", "?")
        color = color_map.get(cls_name, (255, 212, 0))

        # Check for violation — use red color
        violation = det.get("violation")
        if violation and violation.get("active"):
            color = (0, 0, 255)  # Red for violations

        # Draw bounding box
        cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)

        # Corner markers
        corner_len = min(15, (x2 - x1) // 3, (y2 - y1) // 3)
        # Top-left
        cv2.line(annotated, (x1, y1), (x1 + corner_len, y1), color, 3)
        cv2.line(annotated, (x1, y1), (x1, y1 + corner_len), color, 3)
        # Top-right
        cv2.line(annotated, (x2, y1), (x2 - corner_len, y1), color, 3)
        cv2.line(annotated, (x2, y1), (x2, y1 + corner_len), color, 3)
        # Bottom-left
        cv2.line(annotated, (x1, y2), (x1 + corner_len, y2), color, 3)
        cv2.line(annotated, (x1, y2), (x1, y2 - corner_len), color, 3)
        # Bottom-right
        cv2.line(annotated, (x2, y2), (x2 - corner_len, y2), color, 3)
        cv2.line(annotated, (x2, y2), (x2, y2 - corner_len), color, 3)

        # Label background
        label = f"{cls_name} {confidence:.2f} | ID:{track_id}"
        (label_w, label_h), baseline = cv2.getTextSize(
            label, cv2.FONT_HERSHEY_SIMPLEX, 0.4, 1
        )
        cv2.rectangle(
            annotated,
            (x1, y1 - label_h - baseline - 6),
            (x1 + label_w + 4, y1),
            color,
            -1,
        )
        cv2.putText(
            annotated,
            label,
            (x1 + 2, y1 - baseline - 3),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.4,
            (0, 0, 0),
            1,
            cv2.LINE_AA,
        )

        # License plate text
        plate = det.get("plate")
        if plate and plate.get("text"):
            plate_label = f"PLATE: {plate['text']}"
            cv2.putText(
                annotated,
                plate_label,
                (x1, y2 + 15),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.4,
                (0, 255, 255),
                1,
                cv2.LINE_AA,
            )

    return annotated

```

---
FILE: backend/app/utils/video_utils.py

```python
"""
SENTINEL — Video Utilities
Video metadata extraction and frame iteration with FPS control.
"""
import logging

import cv2

logger = logging.getLogger(__name__)


def get_video_info(video_path: str) -> dict:
    """Extract metadata from a video file."""
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"Cannot open video: {video_path}")

    info = {
        "width": int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)),
        "height": int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)),
        "fps": cap.get(cv2.CAP_PROP_FPS),
        "total_frames": int(cap.get(cv2.CAP_PROP_FRAME_COUNT)),
        "duration_seconds": 0.0,
    }

    if info["fps"] > 0:
        info["duration_seconds"] = info["total_frames"] / info["fps"]

    cap.release()
    logger.info("Video info: %s", info)
    return info


def compute_frame_skip(source_fps: float, target_fps: int) -> int:
    """
    Compute how many frames to skip to achieve target FPS.
    Returns 1 if no skipping is needed.
    """
    if source_fps <= 0 or target_fps <= 0:
        return 1
    skip = max(1, int(source_fps / target_fps))
    return skip

```

---
FILE: backend/app/services/__init__.py

```python
# services package

```

---
FILE: backend/app/services/websocket_manager.py

```python
"""
SENTINEL — WebSocket Connection Manager
Manages active WebSocket connections by session.
"""
import logging
from typing import Any

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class WebSocketManager:
    """Manages active WebSocket connections by session for telemetry/health."""

    def __init__(self):
        self._connections: dict[str, WebSocket] = {}

    def register(self, session_id: str, websocket: WebSocket) -> None:
        """Register an active WebSocket connection."""
        self._connections[session_id] = websocket
        logger.info("WebSocket registered for session: %s", session_id)

    def unregister(self, session_id: str) -> None:
        """Unregister a WebSocket connection."""
        self._connections.pop(session_id, None)
        logger.info("WebSocket unregistered for session: %s", session_id)

    def is_connected(self, session_id: str) -> bool:
        return session_id in self._connections

    @property
    def active_connections(self) -> int:
        return len(self._connections)


# Global singleton
ws_manager = WebSocketManager()

```

---
FILE: backend/app/services/violation_service.py

```python
"""
SENTINEL — Violation Detection Service
Virtual spatial rules for traffic violation detection.
"""
import logging
import math
from typing import Any

from app.config import (
    VIOLATION_LANE_LINE,
    ALLOWED_DIRECTION,
    DIRECTION_MIN_DISPLACEMENT,
)

logger = logging.getLogger(__name__)


class ViolationService:
    """
    Detects traffic violations based on virtual spatial rules.
    Supports: wrong lane, opposite direction.
    """

    def __init__(self):
        # Per-track violation state to avoid duplicate alerts
        self._track_violations: dict[int, dict[str, bool]] = {}
        # Alert counter for unique IDs
        self._alert_counter = 0

    def check_violations(
        self,
        track_id: int,
        centroid: tuple[float, float],
        direction: tuple[float, float] | None,
        frame_width: int,
        frame_height: int,
    ) -> dict[str, Any] | None:
        """
        Check if a tracked vehicle is violating any traffic rules.

        Args:
            track_id: Unique track identifier
            centroid: (cx, cy) of the vehicle in pixel coordinates
            direction: (dx, dy) movement vector, or None if unknown
            frame_width: Width of the video frame
            frame_height: Height of the video frame

        Returns:
            {"type": "wrong_lane", "active": True} or None
        """
        if track_id not in self._track_violations:
            self._track_violations[track_id] = {
                "wrong_lane": False,
                "opposite_direction": False,
            }

        violation = None

        # ── Check wrong lane ─────────────────────────────
        wrong_lane = self._check_wrong_lane(centroid, frame_width, frame_height)
        if wrong_lane and not self._track_violations[track_id]["wrong_lane"]:
            self._track_violations[track_id]["wrong_lane"] = True
            violation = {"type": "wrong_lane", "active": True}

        # ── Check opposite direction ─────────────────────
        if direction is not None:
            opposite = self._check_opposite_direction(direction)
            if opposite and not self._track_violations[track_id]["opposite_direction"]:
                self._track_violations[track_id]["opposite_direction"] = True
                violation = {"type": "opposite_direction", "active": True}

        return violation

    def _check_wrong_lane(
        self,
        centroid: tuple[float, float],
        frame_width: int,
        frame_height: int,
    ) -> bool:
        """
        Check if the vehicle centroid is on the wrong side of the virtual lane line.
        The lane line divides the frame. Vehicles on the left side are considered
        to be in the wrong lane (configurable).
        """
        cx, cy = centroid

        # Convert lane line from normalized (0-1) to pixel coordinates
        line_start = (
            VIOLATION_LANE_LINE[0][0] * frame_width,
            VIOLATION_LANE_LINE[0][1] * frame_height,
        )
        line_end = (
            VIOLATION_LANE_LINE[1][0] * frame_width,
            VIOLATION_LANE_LINE[1][1] * frame_height,
        )

        # Use cross product to determine which side of the line the point is on
        # If cross product < 0, point is on the "wrong" side
        cross = (
            (line_end[0] - line_start[0]) * (cy - line_start[1])
            - (line_end[1] - line_start[1]) * (cx - line_start[0])
        )

        return cross < 0

    def _check_opposite_direction(self, direction: tuple[float, float]) -> bool:
        """
        Check if the vehicle is moving in the opposite direction to the allowed flow.
        Uses dot product: negative = opposite direction.
        """
        dx, dy = direction

        # Compute displacement magnitude
        magnitude = math.sqrt(dx * dx + dy * dy)
        if magnitude < DIRECTION_MIN_DISPLACEMENT:
            return False

        # Normalize
        dx_norm = dx / magnitude
        dy_norm = dy / magnitude

        # Dot product with allowed direction
        dot = dx_norm * ALLOWED_DIRECTION[0] + dy_norm * ALLOWED_DIRECTION[1]

        # If strongly opposite (dot < -0.5), it's a violation
        return dot < -0.5

    def generate_alert(self, violation_type: str, track_id: int) -> dict[str, Any]:
        """Generate a violation alert message."""
        self._alert_counter += 1

        messages = {
            "wrong_lane": f"Wrong lane detected — Vehicle #{track_id}",
            "opposite_direction": f"Opposite direction detected — Vehicle #{track_id}",
        }
        severities = {
            "wrong_lane": "high",
            "opposite_direction": "critical",
        }

        return {
            "id": f"alert_{self._alert_counter:04d}",
            "message": messages.get(violation_type, f"Violation: {violation_type}"),
            "severity": severities.get(violation_type, "medium"),
        }

    def cleanup_track(self, track_id: int) -> None:
        """Remove violation state for a deregistered track."""
        self._track_violations.pop(track_id, None)

    def reset(self) -> None:
        """Reset all violation state."""
        self._track_violations.clear()
        self._alert_counter = 0


# Global singleton
violation_service = ViolationService()

```

---
