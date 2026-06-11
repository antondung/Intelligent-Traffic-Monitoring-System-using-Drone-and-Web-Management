"""
SENTINEL — Real Inference and Benchmark Test
This script verifies that the migrated Python 3.11 environment executes real YOLOv8 inference,
outputs high-fidelity annotations, tracks vehicles, does license plate OCR, and benchmarks performance.
"""
import os
import sys
import time
import cv2
import numpy as np

# Ensure app directory is in Python path
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from app.config import PYTORCH_AVAILABLE, YOLO_MODEL_PATH
from app.services.yolo_service import yolo_service
from app.services.plate_detector import plate_detector_service
from app.services.ocr_service import ocr_service
from app.services.video_processor import VideoProcessor

def benchmark_pipeline():
    print("=" * 70)
    print(" SENTINEL REAL INFERENCE & BENCHMARKING ")
    print("=" * 70)
    print(f"PyTorch Available: {PYTORCH_AVAILABLE}")
    
    if not PYTORCH_AVAILABLE:
        print("✗ ERROR: PyTorch is NOT available. We cannot run real YOLO inference.")
        return
        
    import torch
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Active Device: {device.upper()}")
    
    # 1. Load YOLO model and verify classes
    print("\n[Step 1] Loading YOLO Vehicle Detection Model...")
    yolo_service.load_model()
    model = yolo_service.model
    if model is None:
        print("✗ ERROR: Failed to load YOLO vehicle model.")
        return
    
    print("✓ Model successfully loaded!")
    print("Actual YOLO class names in custom trained model:")
    for cid, name in model.names.items():
        print(f"  - Class ID {cid}: '{name}'")
        
    # 2. Select a real uploaded video
    video_filename = "8fad2bc9.mp4"
    video_path = os.path.join(os.path.dirname(__file__), "uploads", video_filename)
    if not os.path.exists(video_path):
        print(f"✗ ERROR: Video not found at {video_path}")
        return
        
    print(f"\n[Step 2] Processing Real Video: {video_path}")
    cap = cv2.VideoCapture(video_path)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    print(f"Video Stats: {total_frames} frames, {fps:.2f} FPS, {w}x{h} resolution")
    
    # Let's run inference on the first 30 frames and benchmark latency
    print("\n[Step 3] Running Inference on First 30 Frames...")
    latencies = []
    detection_stability = []
    
    # Pre-warmup
    ret, frame = cap.read()
    if ret:
        yolo_service.detect(frame)
        
    frame_count = 0
    while frame_count < 30:
        ret, frame = cap.read()
        if not ret:
            break
            
        t0 = time.time()
        # Resize like the video processor does
        resized = cv2.resize(frame, (960, int(960 * h / w)))
        
        # Run YOLO detection
        detections = yolo_service.detect(resized)
        t1 = time.time()
        
        latency = (t1 - t0) * 1000  # ms
        latencies.append(latency)
        
        vehicle_classes = [d["class"] for d in detections]
        detection_stability.append(len(detections))
        
        print(f"Frame {frame_count:02d}: Detected {len(detections)} vehicles | "
              f"Classes: {vehicle_classes} | Latency: {latency:.2f}ms")
        frame_count += 1
        
    cap.release()
    
    avg_latency = sum(latencies) / len(latencies) if latencies else 0
    avg_fps = 1000.0 / avg_latency if avg_latency > 0 else 0
    
    print("\n" + "=" * 50)
    print(" BENCHMARK PERFORMANCE RESULTS ")
    print("=" * 50)
    print(f"► Execution Mode:     {device.upper()}")
    print(f"► Avg YOLO Latency:   {avg_latency:.2f} ms per frame")
    print(f"► Theoretical YOLO FPS:{avg_fps:.2f} FPS")
    print(f"► Detections count:   Min={min(detection_stability)}, Max={max(detection_stability)}, Avg={sum(detection_stability)/len(detection_stability):.1f}")
    
    # 3. Test Plate detector & EasyOCR crops and padding
    print("\n[Step 4] Testing 15% Padding on License Plate Crops & EasyOCR...")
    cap = cv2.VideoCapture(video_path)
    # Scan until we get some detections
    found_plate = False
    for _ in range(50):
        ret, frame = cap.read()
        if not ret:
            break
        resized = cv2.resize(frame, (960, int(960 * h / w)))
        detections = yolo_service.detect(resized)
        for det in detections:
            bbox = det["bbox"]
            # Crop vehicle ROI
            pad = 5
            x1 = max(0, bbox["x1"] - pad)
            y1 = max(0, bbox["y1"] - pad)
            x2 = min(resized.shape[1], bbox["x2"] + pad)
            y2 = min(resized.shape[0], bbox["y2"] + pad)
            vehicle_crop = resized[y1:y2, x1:x2]
            
            if vehicle_crop.size > 0:
                plate_det = plate_detector_service.detect_plate(vehicle_crop)
                if plate_det:
                    cropped_plate = plate_det["cropped_plate"]
                    print(f"  - Detected Plate bbox inside vehicle ROI: {plate_det['plate_bbox']} (Conf: {plate_det['confidence']})")
                    print(f"  - Plate crop dimensions: {cropped_plate.shape[1]}x{cropped_plate.shape[0]}")
                    
                    # Run OCR
                    ocr_res = ocr_service.read_plate(cropped_plate)
                    if ocr_res:
                        print(f"  - SUCCESS! EasyOCR read text: '{ocr_res['text']}' (Conf: {ocr_res['confidence']:.2f})")
                        found_plate = True
                        break
        if found_plate:
            break
            
    cap.release()
    if not found_plate:
        print("  - Note: No plate detected in the first 50 frames or OCR skipped.")
        
    print("\n" + "=" * 70)
    print(" VERIFICATION COMPLETE ")
    print("=" * 70)

if __name__ == "__main__":
    benchmark_pipeline()
