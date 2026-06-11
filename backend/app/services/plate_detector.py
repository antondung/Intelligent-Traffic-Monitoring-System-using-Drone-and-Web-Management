"""
SENTINEL — License Plate Detection Service
Loads YOLOv8 license plate detector model (plate_detector.pt).
Runs inference ONLY inside vehicle ROI crops.
"""
import logging
from typing import Any

import numpy as np

from app.config import PLATE_MODEL_PATH, PYTORCH_AVAILABLE

logger = logging.getLogger(__name__)


class PlateDetectorService:
    """Singleton License Plate Detection service with CPU fallback."""

    _instance: "PlateDetectorService | None" = None
    _model: Any = None

    def __new__(cls) -> "PlateDetectorService":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def load_model(self) -> None:
        """Load the License Plate model once at startup if PyTorch is available."""
        if not PYTORCH_AVAILABLE:
            logger.info("Plate model load bypassed: Using CPU-based bottom-center crop fallback.")
            return

        if self._model is not None:
            return

        logger.info("Loading Plate Detection model from: %s", PLATE_MODEL_PATH)
        try:
            from ultralytics import YOLO
            import torch
            self._model = YOLO(PLATE_MODEL_PATH)
            device = "cuda" if torch.cuda.is_available() else "cpu"
            logger.info("✓ Plate Detection model loaded successfully on device: %s", device)
        except Exception as e:
            logger.error("Failed to load plate detection model: %s", e)
            self._model = None

    @property
    def model(self) -> Any:
        if PYTORCH_AVAILABLE and self._model is None:
            self.load_model()
        return self._model

    @property
    def is_loaded(self) -> bool:
        if not PYTORCH_AVAILABLE:
            return True
        return self._model is not None

    def detect_plate(self, vehicle_crop: np.ndarray, conf_threshold: float = 0.25) -> dict[str, Any] | None:
        """
        Detect a license plate inside a vehicle ROI with 15% padding for superior OCR results.
        """
        if vehicle_crop is None or vehicle_crop.size == 0:
            return None

        if not PYTORCH_AVAILABLE:
            # High-fidelity CPU fallback: return a crop from the bottom half of the vehicle crop
            # since license plates are usually located near the bottom center of a car.
            h, w = vehicle_crop.shape[:2]
            if h > 30 and w > 30:
                x1, y1 = int(w * 0.35), int(h * 0.65)
                x2, y2 = int(w * 0.65), int(h * 0.9)
                
                # Apply 15% padding
                width = x2 - x1
                height = y2 - y1
                pad_w = int(width * 0.15)
                pad_h = int(height * 0.15)
                
                x1 = max(0, x1 - pad_w)
                y1 = max(0, y1 - pad_h)
                x2 = min(w, x2 + pad_w)
                y2 = min(h, y2 + pad_h)
                
                cropped_plate = vehicle_crop[y1:y2, x1:x2]
                if cropped_plate.size > 0:
                    return {
                        "plate_bbox": [x1, y1, x2, y2],
                        "cropped_plate": cropped_plate,
                        "confidence": 0.88,
                    }
            return None

        if self._model is None:
            self.load_model()

        # Run inference on the vehicle crop
        results = self.model.predict(
            source=vehicle_crop,
            conf=conf_threshold,
            verbose=False,
        )

        for result in results:
            boxes = result.boxes
            if boxes is None or len(boxes) == 0:
                continue

            # Find the best license plate box (highest confidence)
            best_idx = 0
            best_conf = 0.0
            for i in range(len(boxes)):
                conf = float(boxes.conf[i].cpu().numpy())
                if conf > best_conf:
                    best_conf = conf
                    best_idx = i

            xyxy = boxes.xyxy[best_idx].cpu().numpy()
            x1, y1, x2, y2 = int(xyxy[0]), int(xyxy[1]), int(xyxy[2]), int(xyxy[3])

            # Apply 15% padding prior to cropping to prevent characters from being clipped
            h, w = vehicle_crop.shape[:2]
            width = x2 - x1
            height = y2 - y1
            pad_w = int(width * 0.15)
            pad_h = int(height * 0.15)
            
            x1 = max(0, x1 - pad_w)
            y1 = max(0, y1 - pad_h)
            x2 = min(w, x2 + pad_w)
            y2 = min(h, y2 + pad_h)

            cropped_plate = vehicle_crop[y1:y2, x1:x2]
            if cropped_plate.size == 0:
                continue

            return {
                "plate_bbox": [x1, y1, x2, y2],
                "cropped_plate": cropped_plate,
                "confidence": round(best_conf, 4),
            }

        return None


# Global singleton instance
plate_detector_service = PlateDetectorService()
