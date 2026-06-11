import sys
import os
import cv2
import torch
from ultralytics import YOLO

def main():
    print("=" * 60)
    print("LIGHTWEIGHT YOLO DIAGNOSIS")
    print("=" * 60)

    # 1. model path
    model_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "models", "best.pt"))
    print(f"Model Path: {model_path}")

    # 2. model load success
    try:
        model = YOLO(model_path)
        model_load_success = True
        print(f"Model Load Success: {model_load_success}")
    except Exception as e:
        model_load_success = False
        print(f"Model Load Success: {model_load_success} ({e})")
        sys.exit(1)

    # 3. device
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Device: {device}")

    # 4. open uploaded video
    video_path = os.path.join(os.path.dirname(__file__), "uploads", "8fad2bc9.mp4")
    if not os.path.exists(video_path):
        import glob
        videos = glob.glob(os.path.join(os.path.dirname(__file__), "uploads", "*.mp4"))
        if videos:
            video_path = videos[0]
        else:
            print("Error: No mp4 video found in uploads.")
            sys.exit(1)
            
    print(f"Video Path: {video_path}")

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"Error: Cannot open video {video_path}")
        sys.exit(1)

    # 5. sample ONLY 3-5 frames and run YOLO inference ONLY, printing raw detections immediately
    frame_count = 0
    max_frames = 5
    print(f"Sampling {max_frames} frames for lightweight inference...")
    
    while frame_count < max_frames:
        ret, frame = cap.read()
        if not ret:
            print("End of video stream reached.")
            break
        
        frame_count += 1
        print(f"\n--- Frame {frame_count} ---")
        
        # 4. frame shape
        print(f"Frame Shape: {frame.shape}")
        
        # Run YOLO inference directly
        results = model.predict(source=frame, conf=0.25, verbose=False)
        
        for result in results:
            boxes = result.boxes
            if boxes is None or len(boxes) == 0:
                print("Raw Detection Count: 0")
                print("Raw Class Names: []")
                print("Confidence Scores: []")
                continue
                
            # 5. raw detection count
            print(f"Raw Detection Count: {len(boxes)}")
            
            # Extract class names and confidence scores
            raw_class_names = []
            confidence_scores = []
            for i in range(len(boxes)):
                cls_id = int(boxes.cls[i].cpu().numpy())
                class_name = model.names.get(cls_id, f"class_{cls_id}")
                conf = float(boxes.conf[i].cpu().numpy())
                raw_class_names.append(class_name)
                confidence_scores.append(round(conf, 4))
                
            # 6. raw class names
            print(f"Raw Class Names: {raw_class_names}")
            # 7. confidence scores
            print(f"Confidence Scores: {confidence_scores}")

    cap.release()
    print("=" * 60)
    print("LIGHTWEIGHT DIAGNOSIS COMPLETE")
    print("=" * 60)

if __name__ == "__main__":
    main()
