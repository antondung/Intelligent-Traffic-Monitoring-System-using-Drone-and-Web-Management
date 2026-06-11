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
