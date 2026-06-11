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
