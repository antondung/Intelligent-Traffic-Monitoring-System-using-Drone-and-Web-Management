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
