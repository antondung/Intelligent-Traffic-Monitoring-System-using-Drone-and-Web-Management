import sys
import os
import cv2
import numpy as np

# Ensure app directory is in Python path
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from app.config import PYTORCH_AVAILABLE
from app.services.yolo_service import yolo_service
from app.services.tracking_service import ByteTrackTracker

def test_tracker_parameters():
    print("=" * 60)
    print(" TESTING TRACKER PARAMETERS ")
    print("=" * 60)
    
    yolo_service.load_model()
    
    video_filename = "8fad2bc9.mp4"
    video_path = os.path.join(os.path.dirname(__file__), "uploads", video_filename)
    if not os.path.exists(video_path):
        print(f"✗ ERROR: Video not found at {video_path}")
        return

    # Try different matching thresholds
    for matching_thresh in [0.8, 0.3]:
        print(f"\n--- Testing with minimum_matching_threshold = {matching_thresh} ---")
        
        # Initialize a new tracker for this test
        import supervision as sv
        tracker = ByteTrackTracker()
        # Override the match threshold directly
        if hasattr(tracker, "_tracker") and tracker._tracker is not None:
            tracker._tracker.minimum_matching_threshold = matching_thresh
            # Set consecutive frames to 1 to see immediate detections
            tracker._tracker.minimum_consecutive_frames = 1
            
        cap = cv2.VideoCapture(video_path)
        frame_idx = 0
        total_tracked = 0
        
        while frame_idx < 10:
            ret, frame = cap.read()
            if not ret:
                break
            frame_idx += 1
            
            # Resize frame
            from app.utils.image_utils import resize_frame
            from app.config import FRAME_RESIZE_WIDTH
            processed = resize_frame(frame, FRAME_RESIZE_WIDTH)
            
            raw_dets = yolo_service.detect(processed)
            tracked_dets = tracker.update(raw_dets)
            
            print(f"Frame {frame_idx:02d}: Raw Dets = {len(raw_dets)} | Tracked Dets = {len(tracked_dets)}")
            total_tracked += len(tracked_dets)
            
        cap.release()
        print(f"Total tracked detections over 10 frames: {total_tracked}")

if __name__ == "__main__":
    test_tracker_parameters()
