import os
import sys
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("SENTINEL-DIAGNOSIS")

def diagnose():
    print("=" * 60)
    print("SENTINEL AI PIPELINE DIAGNOSIS")
    print("=" * 60)
    
    # Check Python environment
    print(f"Python Version: {sys.version}")
    print(f"Current Directory: {os.getcwd()}")
    
    # 1. Check PyTorch & DLL availability
    print("\n--- 1. Checking PyTorch & GPU Availability ---")
    pytorch_available = False
    try:
        import torch
        print(f"PyTorch Version: {torch.__version__}")
        print(f"CUDA Available: {torch.cuda.is_available()}")
        if torch.cuda.is_available():
            print(f"CUDA Device: {torch.cuda.get_device_name(0)}")
        pytorch_available = True
    except BaseException as e:
        print(f"PyTorch is NOT fully available/functional: {e}")
        import traceback
        traceback.print_exc()

    # 2. Check Ultralytics & Model Loading
    print("\n--- 2. Checking YOLOv8 Model ---")
    model_path = os.path.join("models", "best.pt")
    print(f"Checking for model file at: {model_path}")
    if os.path.exists(model_path):
        print(f"Model file exists. Size: {os.path.getsize(model_path)} bytes")
    else:
        print("CRITICAL: Models file 'best.pt' does not exist in backend/models!")
        return

    model = None
    if pytorch_available:
        try:
            from ultralytics import YOLO
            print("Loading YOLOv8 model...")
            model = YOLO(model_path)
            print("✓ Model loaded successfully!")
            
            # Print exact class names
            print("\nExact YOLO Class Names Loaded:")
            print(model.names)
        except Exception as e:
            print(f"Failed to load model using PyTorch: {e}")
            import traceback
            traceback.print_exc()
    else:
        print("PyTorch not available. Showing Fallback CV class mappings.")
        # Fallback mappings:
        from app.services.yolo_service import yolo_service
        print("Fallback class names used by OpenCV motion engine:")
        print("['car', 'motorbike', 'bus', 'truck', 'bicycle', 'person']")

    # 3. Print raw detection output and verify inference
    print("\n--- 3. Running Raw Detection & Inference Test ---")
    import numpy as np
    import cv2

    # Create a synthetic image of 960x540 (our standard resize frame size)
    # Draw some shapes representing vehicle contours
    synthetic_frame = np.zeros((540, 960, 3), dtype=np.uint8)
    # A box for a "car"
    cv2.rectangle(synthetic_frame, (100, 100), (300, 250), (255, 255, 255), -1)
    # A box for a "motorbike"
    cv2.rectangle(synthetic_frame, (400, 300), (480, 420), (255, 255, 255), -1)
    # A box for a "person"
    cv2.rectangle(synthetic_frame, (600, 100), (630, 250), (255, 255, 255), -1)

    print("Running detection on 960x540 synthetic frame...")
    if pytorch_available and model is not None:
        try:
            results = model.predict(source=synthetic_frame, conf=0.25, iou=0.5, verbose=False)
            print(f"Number of prediction results: {len(results)}")
            for idx, result in enumerate(results):
                boxes = result.boxes
                print(f"Result {idx} boxes count: {len(boxes) if boxes is not None else 0}")
                if boxes is not None:
                    for i in range(len(boxes)):
                        xyxy = boxes.xyxy[i].cpu().numpy()
                        cls_id = int(boxes.cls[i].cpu().numpy())
                        name = model.names.get(cls_id, "unknown")
                        conf = float(boxes.conf[i].cpu().numpy())
                        print(f"  Box {i}: xyxy={xyxy}, class_id={cls_id}, name={name}, conf={conf:.4f}")
        except Exception as e:
            print(f"Inference error: {e}")
    else:
        # Fallback CV detector test
        from app.services.yolo_service import yolo_service
        detections = yolo_service.detect(synthetic_frame)
        print(f"Fallback CV engine detected {len(detections)} shapes:")
        for i, det in enumerate(detections):
            print(f"  Detection {i}: class={det['class']}, conf={det['confidence']}, bbox={det['bbox']}")

    # 4. Check Frontend to Backend Mappings
    print("\n--- 4. Checking Frontend Class Mappings ---")
    from app.config import CLASS_NAME_MAP, YOLO_CONFIDENCE_THRESHOLD, YOLO_IOU_THRESHOLD
    print(f"Backend CLASS_NAME_MAP: {CLASS_NAME_MAP}")
    print(f"Backend YOLO_CONFIDENCE_THRESHOLD: {YOLO_CONFIDENCE_THRESHOLD}")
    print(f"Backend YOLO_IOU_THRESHOLD (NMS): {YOLO_IOU_THRESHOLD}")
    
    # 5. Check coordinates scaling and trackers
    print("\n--- 5. Checking Tracker & Scaling Settings ---")
    from app.config import FRAME_RESIZE_WIDTH, MAX_FPS
    print(f"Backend Frame Resize Width: {FRAME_RESIZE_WIDTH}")
    print(f"Backend Target Streaming FPS: {MAX_FPS}")
    print("Tracking hit threshold configuration (TRACKER_MIN_HITS): 3")

    print("\n" + "=" * 60)
    print("DIAGNOSIS END")
    print("=" * 60)

if __name__ == "__main__":
    diagnose()
