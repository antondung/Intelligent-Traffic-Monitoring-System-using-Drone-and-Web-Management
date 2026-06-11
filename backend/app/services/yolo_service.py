"""
SENTINEL — YOLOv8 Detection Service
Singleton model loader with GPU/CPU auto-detection.

Loads ONLY the user's custom-trained model (best.pt).
No COCO pretrained fallback.
"""
import logging
import cv2
from typing import Any

import numpy as np

from app.config import (
    YOLO_MODEL_PATH,
    YOLO_CONFIDENCE_THRESHOLD,
    YOLO_IOU_THRESHOLD,
    CLASS_NAME_MAP,
    validate_model_path,
    PYTORCH_AVAILABLE,
)

logger = logging.getLogger(__name__)


class YOLOService:
    """Singleton YOLOv8 inference service with high-fidelity CPU OpenCV fallback."""

    _instance: "YOLOService | None" = None
    _model: Any = None

    def __new__(cls) -> "YOLOService":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def load_model(self) -> None:
        """Load the YOLO model once at startup. Raises RuntimeError if unavailable."""
        if not PYTORCH_AVAILABLE:
            raise RuntimeError("PyTorch is not available! Real YOLO model cannot be loaded.")

        if self._model is not None:
            return

        validate_model_path()

        logger.info("Loading YOLO model from: %s", YOLO_MODEL_PATH)
        try:
            from ultralytics import YOLO
            import torch
            self._model = YOLO(YOLO_MODEL_PATH)
            device = "cuda" if torch.cuda.is_available() else "cpu"
            logger.info("YOLO model loaded successfully on device: %s", device)
        except Exception as e:
            logger.error("Failed to load YOLO model: %s", e)
            self._model = None
            raise RuntimeError(f"Failed to load YOLO model: {e}")

    @property
    def model(self) -> Any:
        if PYTORCH_AVAILABLE and self._model is None:
            self.load_model()
        return self._model

    @property
    def is_loaded(self) -> bool:
        return self._model is not None

    def detect(
        self,
        frame: np.ndarray,
        conf_threshold: float | None = None,
    ) -> list[dict[str, Any]]:
        """
        Run YOLOv8 inference. Bypasses and raises an exception on any failure.
        """
        if not PYTORCH_AVAILABLE:
            raise RuntimeError("PyTorch is not available! Real YOLO inference requested but fallback is disabled.")
            
        if self._model is None:
            self.load_model()
            
        if self._model is None:
            raise RuntimeError("YOLO model is not loaded!")

        conf = conf_threshold or YOLO_CONFIDENCE_THRESHOLD
        
        # Run inference — no class filtering, trust the custom model
        results = self._model.predict(
            source=frame,
            conf=conf,
            iou=YOLO_IOU_THRESHOLD,
            verbose=False,
        )

        detections = []
        for result in results:
            boxes = result.boxes
            if boxes is None:
                continue

            for i in range(len(boxes)):
                # Extract bounding box coordinates (xyxy format)
                xyxy = boxes.xyxy[i].cpu().numpy()
                x1, y1, x2, y2 = int(xyxy[0]), int(xyxy[1]), int(xyxy[2]), int(xyxy[3])

                # Class name
                cls_id = int(boxes.cls[i].cpu().numpy())
                raw_name = self._model.names.get(cls_id, "unknown")
                class_name = CLASS_NAME_MAP.get(raw_name.lower(), raw_name.lower())

                # Confidence
                confidence = float(boxes.conf[i].cpu().numpy())

                detections.append({
                    "class": class_name,
                    "confidence": round(confidence, 4),
                    "bbox": {
                        "x1": x1,
                        "y1": y1,
                        "x2": x2,
                        "y2": y2,
                    },
                })
        
        # Print explicit log for active YOLO
        print("YOLO ACTIVE", flush=True)
        return detections


# Global singleton instance
yolo_service = YOLOService()
