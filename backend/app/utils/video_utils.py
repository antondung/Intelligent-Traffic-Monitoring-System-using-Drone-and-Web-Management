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
