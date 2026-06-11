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
