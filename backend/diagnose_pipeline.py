import sys
import os
import cv2
import numpy as np

# Ensure app directory is in Python path
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from app.config import PYTORCH_AVAILABLE, YOLO_MODEL_PATH
from app.services.yolo_service import yolo_service
from app.services.tracking_service import tracking_service

def diagnose():
    print("=" * 60)
    print(" SENTINEL PIPELINE DIAGNOSTIC ")
    print("=" * 60)
    print(f"PyTorch Available: {PYTORCH_AVAILABLE}")
    
    yolo_service.load_model()
    model = yolo_service.model
    if model is None:
        print("✗ ERROR: Failed to load YOLO vehicle model.")
        return
        
    print(f"Model Path: {YOLO_MODEL_PATH}")
    print(f"Device: {getattr(model, 'device', 'unknown')}")
    print("Classes mapping in YOLO:")
    print(model.names)

    # Let's run on uploads/8fad2bc9.mp4 if it exists
    video_filename = "8fad2bc9.mp4"
    video_path = os.path.join(os.path.dirname(__file__), "uploads", video_filename)
    if not os.path.exists(video_path):
        print(f"✗ ERROR: Video not found at {video_path}")
        return

    cap = cv2.VideoCapture(video_path)
    tracker = tracking_service.get_tracker("diag_session")

    print("\nProcessing first 15 frames...")
    frame_idx = 0
    while frame_idx < 15:
        ret, frame = cap.read()
        if not ret:
            break
            
        frame_idx += 1
        
        # 1. Resize like VideoProcessor does (width = 640)
        from app.utils.image_utils import resize_frame
        from app.config import FRAME_RESIZE_WIDTH
        processed = resize_frame(frame, FRAME_RESIZE_WIDTH)
        h, w = processed.shape[:2]
        
        # 2. Run YOLO
        raw_dets = yolo_service.detect(processed)
        
        # 3. Update Tracker
        tracked_dets = tracker.update(raw_dets)
        
        print(f"Frame {frame_idx:02d} ({w}x{h}): Raw YOLO Dets = {len(raw_dets)} | Tracked Dets = {len(tracked_dets)}")
        if raw_dets:
            classes = [d["class"] for d in raw_dets]
            confs = [d["confidence"] for d in raw_dets]
            print(f"  -> Raw classes: {classes}")
            print(f"  -> Raw confs: {confs}")
        if tracked_dets:
            t_classes = [d["class"] for d in tracked_dets]
            t_ids = [d["track_id"] for d in tracked_dets]
            print(f"  -> Tracked classes: {t_classes}")
            print(f"  -> Tracked IDs: {t_ids}")
            
    cap.release()

if __name__ == "__main__":
    diagnose()
