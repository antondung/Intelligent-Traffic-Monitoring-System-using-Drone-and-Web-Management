# PHẦN 5: FILE CẤU HÌNH, SCRIPTS CHẨN ĐOÁN, KIỂM THỬ & TÀI LIỆU HƯỚNG DẪN

Bao gồm:
- Toàn bộ các cấu hình hệ thống: package.json, requirements.txt, tsconfig, vite.config.ts, eslint, .gitignore.
- Kịch bản tự động khởi động: start.bat.
- Các script chẩn đoán môi trường chạy (CUDA/PyTorch check, DLL check, OpenCV check).
- Các script kiểm thử độc lập cho OCR, tracker, realtime streaming.
- Metadata model và tài liệu hướng dẫn README.md.

---

FILE: package.json

```json
{
  "name": "smart-traffic-monitoring",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "framer-motion": "^11.18.0",
    "lucide-react": "^0.468.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.1.0",
    "recharts": "^2.15.0",
    "zustand": "^5.0.0"
  },
  "devDependencies": {
    "@eslint/js": "^9.22.0",
    "@tailwindcss/vite": "^4.1.0",
    "@types/react": "^19.0.10",
    "@types/react-dom": "^19.0.4",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "eslint": "^9.22.0",
    "eslint-plugin-react-hooks": "^5.2.0",
    "eslint-plugin-react-refresh": "^0.4.19",
    "globals": "^15.15.0",
    "tailwindcss": "^4.1.0",
    "typescript": "~5.7.2",
    "typescript-eslint": "^8.26.0",
    "vite": "^6.3.0"
  }
}

```

---
FILE: tsconfig.json

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}

```

---
FILE: tsconfig.app.json

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "es2023",
    "lib": ["ES2023", "DOM"],
    "module": "esnext",
    "types": ["vite/client"],
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": false,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "noUnusedLocals": true,
    "noUnusedParameters": true,

    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}

```

---
FILE: tsconfig.node.json

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
    "target": "es2023",
    "lib": ["ES2023"],
    "module": "esnext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": false,
    "moduleDetection": "force",
    "noEmit": true,

    /* Linting */
    "noUnusedLocals": true,
    "noUnusedParameters": true,

    "noFallthroughCasesInSwitch": true
  },
  "include": ["vite.config.ts"]
}

```

---
FILE: vite.config.ts

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://127.0.0.1:8000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
})

```

---
FILE: eslint.config.js

```javascript
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
])

```

---
FILE: .gitignore

```
# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

node_modules
dist
dist-ssr
*.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

```

---
FILE: backend/requirements.txt

```text
fastapi==0.115.6
uvicorn[standard]==0.34.0
ultralytics==8.3.50
easyocr==1.7.2
opencv-python-headless==4.10.0.84
numpy>=1.26.4
python-multipart==0.0.20
pillow>=11.1.0
torch>=2.1.0
torchvision>=0.16.0
supervision>=0.25.0
aiofiles==24.1.0


```

---
FILE: backend/run.py

```python
"""
SENTINEL Backend — Entry Point
Run with: python run.py
"""
import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )

```

---
FILE: start.bat

```batch
@echo off
title SENTINEL AI — Start System
color 0B
cls

echo =====================================================================
echo    ███████ ███████ ███    ██ ████████ ██ ███    ██ ███████ ██      
echo    ██      ██      ████   ██    ██    ██ ████   ██ ██      ██      
echo    ███████ █████   ██ ██  ██    ██    ██ ██ ██  ██ █████   ██      
echo         ██ ██      ██  ██ ██    ██    ██ ██  ██ ██ ██      ██      
echo    ███████ ███████ ██   ████    ██    ██ ██   ████ ███████ ███████ 
echo =====================================================================
echo             REAL-TIME PRODUCTION AI TRAFFIC MONITORING
echo =====================================================================
echo.
echo [1/3] Launching FastAPI Backend Server...
echo       - Python Interpreter: backend\.venv\Scripts\python.exe (Python 3.11.9 Stable)
echo       - Backend Entry: backend/run.py (Port 8000)
echo       - GPU / Model Preloading (best.pt + plate_detector.pt)
start "SENTINEL Backend - FastAPI" cmd /k "color 0E && cd backend && .venv\Scripts\python.exe run.py"

echo.
echo [2/3] Launching Vite Frontend Server...
echo       - Frontend Dev Server: Port 3000
start "SENTINEL Frontend - Vite" cmd /k "color 0A && npm.cmd run dev"

echo.
echo [3/3] Waiting for AI Pipeline to Preload Models...
echo       Please wait 10 seconds for YOLOv8, Plate Detector, and EasyOCR models to initialize...
echo.

:: Simple delay loop for 10 seconds
timeout /t 10 /nobreak >nul

echo ─────────────────────────────────────────────────────────────────────
echo  AI PIPELINE & SERVER HEALTH VERIFICATION
echo ─────────────────────────────────────────────────────────────────────
echo Sending GET request to backend health check: http://localhost:8000/api/health
echo.

:: Run curl health check
curl -s http://localhost:8000/api/health
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo ✗ [ERROR] Health check failed to connect.
    echo           Please check the "SENTINEL Backend" console window for details or errors.
    echo ─────────────────────────────────────────────────────────────────────
    pause
    exit /b 1
)

echo.
echo.
echo ✓ [SUCCESS] Health check returned successfully! The AI Engine is online.
echo.
echo ─────────────────────────────────────────────────────────────────────
echo  ACTIVE SERVICE ENDPOINTS
echo ─────────────────────────────────────────────────────────────────────
echo   ► Vite Web Frontend:  http://localhost:3000
echo   ► REST Backend API:   http://localhost:8000
echo   ► REST Swagger Docs:  http://localhost:8000/docs
echo   ► WebSocket Stream:   ws://localhost:8000/ws/live/{session_id}
echo ─────────────────────────────────────────────────────────────────────
echo.
echo Press any key to exit this starter console. The servers will continue running.
pause >nul

```

---
FILE: backend/pt_metadata.txt

```text
Analyzing models\best.pt...
Total files in zip: 365
Pickle files found: ['best/data.pkl']

Attempting to unpickle best/data.pkl...
Unpickled successfully! Type of root object: <class 'dict'>
Root dictionary keys: ['date', 'version', 'license', 'docs', 'epoch', 'best_fitness', 'model', 'ema', 'updates', 'optimizer', 'scaler', 'train_args', 'train_metrics', 'train_results', 'git']
  date: 2026-04-12T03:33:37.939140
  version: 8.4.37
  Key 'model' is object of class UltralyticsStub with attributes: ['training', '_parameters', '_buffers', '_non_persistent_buffers_set', '_backward_pre_hooks', '_backward_hooks', '_is_full_backward_hook', '_forward_hooks', '_forward_hooks_with_kwargs', '_forward_hooks_always_called', '_forward_pre_hooks', '_forward_pre_hooks_with_kwargs', '_state_dict_hooks', '_state_dict_pre_hooks', '_load_state_dict_pre_hooks', '_load_state_dict_post_hooks', '_modules', 'yaml', 'save', 'names', 'inplace', 'stride', 'nc', 'args', 'criterion']
    FOUND NAMES in model.__dict__: {0: 'person', 1: 'bicycle', 2: 'motorcycle', 3: 'car', 4: 'van', 5: 'bus', 6: 'truck', 7: 'tricycle', 8: 'building', 9: 'aircraft', 10: 'ship', 11: 'soccer-ball-field', 12: 'basketball-court', 13: 'football-field', 14: 'tennis-court', 15: 'baseball-diamond', 16: 'swimming-pool', 17: 'roundabout', 18: 'bridge', 19: 'storage-tank', 20: 'harbor'}
  Key 'train_args' is dict with keys: ['task', 'mode', 'model', 'data', 'epochs', 'time', 'patience', 'batch', 'imgsz', 'save', 'save_period', 'cache', 'device', 'workers', 'project', 'name', 'exist_ok', 'pretrained', 'optimizer', 'verbose', 'seed', 'deterministic', 'single_cls', 'rect', 'cos_lr', 'close_mosaic', 'resume', 'amp', 'fraction', 'profile', 'freeze', 'multi_scale', 'compile', 'overlap_mask', 'mask_ratio', 'dropout', 'val', 'split', 'save_json', 'conf', 'iou', 'max_det', 'half', 'dnn', 'plots', 'end2end', 'source', 'vid_stride', 'stream_buffer', 'visualize', 'augment', 'agnostic_nms', 'classes', 'retina_masks', 'embed', 'show', 'save_frames', 'save_txt', 'save_conf', 'save_crop', 'show_labels', 'show_conf', 'show_boxes', 'line_width', 'format', 'keras', 'optimize', 'int8', 'dynamic', 'simplify', 'opset', 'workspace', 'nms', 'lr0', 'lrf', 'momentum', 'weight_decay', 'warmup_epochs', 'warmup_momentum', 'warmup_bias_lr', 'box', 'cls', 'cls_pw', 'dfl', 'pose', 'kobj', 'rle', 'angle', 'nbs', 'hsv_h', 'hsv_s', 'hsv_v', 'degrees', 'translate', 'scale', 'shear', 'perspective', 'flipud', 'fliplr', 'bgr', 'mosaic', 'mixup', 'cutmix', 'copy_paste', 'copy_paste_mode', 'auto_augment', 'erasing', 'cfg', 'tracker']
  Key 'train_metrics' is dict with keys: ['metrics/precision(B)', 'metrics/recall(B)', 'metrics/mAP50(B)', 'metrics/mAP50-95(B)', 'val/box_loss', 'val/cls_loss', 'val/dfl_loss', 'fitness']
  Key 'train_results' is dict with keys: ['epoch', 'time', 'train/box_loss', 'train/cls_loss', 'train/dfl_loss', 'metrics/precision(B)', 'metrics/recall(B)', 'metrics/mAP50(B)', 'metrics/mAP50-95(B)', 'val/box_loss', 'val/cls_loss', 'val/dfl_loss', 'lr/pg0', 'lr/pg1', 'lr/pg2']
  Key 'git' is dict with keys: ['root', 'branch', 'commit', 'origin']

```

---
FILE: backend/diagnose_ai.py

```python
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

```

---
FILE: backend/diagnose_dll.py

```python
import os
import ctypes
import glob

def diagnose_torch_dlls():
    torch_lib_dir = r"C:\Users\Admin\AppData\Local\Python\pythoncore-3.14-64\Lib\site-packages\torch\lib"
    print(f"Scanning DLLs in: {torch_lib_dir}")
    if not os.path.exists(torch_lib_dir):
        print("Directory does not exist!")
        return
        
    dlls = glob.glob(os.path.join(torch_lib_dir, "*.dll"))
    print(f"Found {len(dlls)} DLLs:")
    for d in dlls:
        basename = os.path.basename(d)
        print(f"  {basename}")
        
    print("\nAttempting to load DLLs one-by-one with ctypes...")
    
    # Add torch/lib to dll search path (Python 3.8+)
    if hasattr(os, 'add_dll_directory'):
        print("Adding DLL directory to path...")
        os.add_dll_directory(torch_lib_dir)
        
    # Set duplicate lib env
    os.environ['KMP_DUPLICATE_LIB_OK'] = 'TRUE'
    
    for d in dlls:
        basename = os.path.basename(d)
        try:
            lib = ctypes.WinDLL(d)
            print(f"SUCCESS: Loaded {basename}")
        except Exception as e:
            print(f"FAILED: {basename} - {e}")

if __name__ == "__main__":
    diagnose_torch_dlls()

```

---
FILE: backend/diagnose_pipeline.py

```python
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

```

---
FILE: backend/light_diagnose.py

```python
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

```

---
FILE: backend/test_venv_dll.py

```python
import os
import ctypes
import glob
import sys

# Prevent Windows from showing error dialog boxes when a DLL load fails
try:
    ctypes.windll.kernel32.SetErrorMode(0x8007)
    print("Disabled Windows critical error dialogs successfully.")
except Exception as e:
    print(f"Could not set error mode: {e}")

def diagnose_torch_dlls():
    venv_dir = os.path.dirname(os.path.dirname(sys.executable))
    torch_lib_dir = os.path.join(venv_dir, "Lib", "site-packages", "torch", "lib")
    print(f"Scanning DLLs in virtual environment: {torch_lib_dir}")
    if not os.path.exists(torch_lib_dir):
        print("Directory does not exist!")
        return
        
    dlls = glob.glob(os.path.join(torch_lib_dir, "*.dll"))
    print(f"Found {len(dlls)} DLLs:")
    for d in dlls:
        basename = os.path.basename(d)
        print(f"  {basename}")
        
    print("\nAttempting to load DLLs one-by-one with ctypes...")
    
    # Add torch/lib to dll search path (Python 3.8+)
    if hasattr(os, 'add_dll_directory'):
        print("Adding DLL directory to search path...")
        os.add_dll_directory(torch_lib_dir)
        
    # Set duplicate lib env
    os.environ['KMP_DUPLICATE_LIB_OK'] = 'TRUE'
    
    # Load them in order: libiomp5md.dll first, then c10.dll, then torch_cpu.dll
    iomp_dll = os.path.join(torch_lib_dir, "libiomp5md.dll")
    if os.path.exists(iomp_dll):
        try:
            ctypes.CDLL(iomp_dll)
            print("Successfully loaded libiomp5md.dll via CDLL")
        except Exception as e:
            print(f"Failed to load libiomp5md.dll: {e}")
            
    for d in dlls:
        basename = os.path.basename(d)
        if basename == "libiomp5md.dll":
            continue
        try:
            lib = ctypes.CDLL(d)
            print(f"SUCCESS: Loaded {basename}")
        except Exception as e:
            print(f"FAILED: {basename} - {e}")

if __name__ == "__main__":
    diagnose_torch_dlls()

```

---
FILE: backend/read_pt_data.py

```python
import os
import zipfile
import pickle
import io

def extract_yolo_metadata():
    model_path = os.path.join("models", "best.pt")
    output_path = "pt_metadata.txt"
    
    with open(output_path, "w", encoding="utf-8") as out:
        out.write(f"Analyzing {model_path}...\n")
        if not os.path.exists(model_path):
            out.write("Model file not found!\n")
            return
            
        try:
            with zipfile.ZipFile(model_path, 'r') as z:
                names = z.namelist()
                out.write(f"Total files in zip: {len(names)}\n")
                
                # The main pickle file in a PyTorch archive is usually named data.pkl (or pickle/data.pkl)
                pkl_files = [n for n in names if n.endswith('.pkl') or n.endswith('data.pkl')]
                out.write(f"Pickle files found: {pkl_files}\n\n")
                
                class SafeUnpickler(pickle.Unpickler):
                    def __init__(self, *args, **kwargs):
                        super().__init__(*args, **kwargs)
                        # Define persistent_load to bypass PyTorch's tensor data storage requests
                        self.persistent_load = self.custom_persistent_load
                        
                    def custom_persistent_load(self, pid):
                        class StorageStub:
                            def __init__(self, *args, **kwargs):
                                pass
                            def __repr__(self):
                                return f"<Storage pid={pid}>"
                        # We return a dummy storage class/instance
                        return StorageStub
                        
                    def find_class(self, module, name):
                        # print(f"Class: {module}.{name}")
                        if module.startswith('torch'):
                            class TorchStub:
                                def __init__(self, *args, **kwargs):
                                    self._module = module
                                    self._name = name
                                    self.args = args
                                    self.kwargs = kwargs
                                def __repr__(self):
                                    return f"<torch.{name}>"
                            return TorchStub
                        if 'ultralytics' in module:
                            class UltralyticsStub:
                                def __init__(self, *args, **kwargs):
                                    self._module = module
                                    self._name = name
                                    self.args = args
                                    self.kwargs = kwargs
                                def __repr__(self):
                                    return f"<ultralytics.{name}>"
                            return UltralyticsStub
                        try:
                            return super().find_class(module, name)
                        except Exception:
                            class GenericStub:
                                def __init__(self, *args, **kwargs):
                                    self._module = module
                                    self._name = name
                                    self.args = args
                                    self.kwargs = kwargs
                                def __repr__(self):
                                    return f"<{module}.{name}>"
                            return GenericStub

                for pkl_file in pkl_files:
                    out.write(f"Attempting to unpickle {pkl_file}...\n")
                    try:
                        data = z.read(pkl_file)
                        unpickler = SafeUnpickler(io.BytesIO(data))
                        res = unpickler.load()
                        out.write(f"Unpickled successfully! Type of root object: {type(res)}\n")
                        if isinstance(res, dict):
                            out.write(f"Root dictionary keys: {list(res.keys())}\n")
                            
                            # Inspect metadata keys
                            metadata_keys = ['names', 'date', 'version', 'stride', 'task']
                            for key in metadata_keys:
                                if key in res:
                                    out.write(f"  {key}: {res[key]}\n")
                                    
                            # Check inside nested objects or other metadata keys
                            for k, v in res.items():
                                if k not in metadata_keys:
                                    if isinstance(v, dict):
                                        out.write(f"  Key '{k}' is dict with keys: {list(v.keys())}\n")
                                        if 'names' in v:
                                            out.write(f"    FOUND NAMES in dict '{k}': {v['names']}\n")
                                    elif hasattr(v, '__dict__'):
                                        out.write(f"  Key '{k}' is object of class {v.__class__.__name__} with attributes: {list(v.__dict__.keys())}\n")
                                        if 'names' in v.__dict__:
                                            out.write(f"    FOUND NAMES in {k}.__dict__: {v.__dict__['names']}\n")
                                            
                                        # Let's search inside the model properties
                                        model_dict = v.__dict__
                                        if 'model' in model_dict:
                                            sub_m = model_dict['model']
                                            out.write(f"    Found model inside {k}: {type(sub_m)}\n")
                                            if hasattr(sub_m, '__dict__'):
                                                out.write(f"      Model attributes: {list(sub_m.__dict__.keys())}\n")
                                                if 'names' in sub_m.__dict__:
                                                    out.write(f"      FOUND NAMES in model: {sub_m.__dict__['names']}\n")
                                                    
                                        # Recursively check sub-attributes for "names" key
                                        for attr_k, attr_v in model_dict.items():
                                            if isinstance(attr_v, dict) and 'names' in attr_v:
                                                out.write(f"      FOUND NAMES in attr '{attr_k}' dict: {attr_v['names']}\n")
                                            elif hasattr(attr_v, '__dict__') and 'names' in attr_v.__dict__:
                                                out.write(f"      FOUND NAMES in attr '{attr_k}' __dict__: {attr_v.__dict__['names']}\n")
                                                    
                        else:
                            out.write(f"Root object attributes: {list(res.__dict__.keys()) if hasattr(res, '__dict__') else 'No __dict__'}\n")
                    except Exception as e:
                        out.write(f"Failed to unpickle {pkl_file}: {e}\n")
                        import traceback
                        traceback.print_exc(file=out)
                        
        except Exception as e:
            out.write(f"Zip file operations failed: {e}\n")
            
    print("Done! Metadata saved to pt_metadata.txt")

if __name__ == "__main__":
    extract_yolo_metadata()

```

---
FILE: backend/test_load_order.py

```python
import os
import ctypes

def test_load():
    torch_lib_dir = r"C:\Users\Admin\AppData\Local\Python\pythoncore-3.14-64\Lib\site-packages\torch\lib"
    print("Testing load order...")
    
    # Pre-load libiomp5md.dll
    iomp_path = os.path.join(torch_lib_dir, "libiomp5md.dll")
    try:
        ctypes.CDLL(iomp_path)
        print("SUCCESS: Loaded libiomp5md.dll directly")
    except Exception as e:
        print(f"FAILED: Loaded libiomp5md.dll directly: {e}")
        
    # Try c10.dll
    c10_path = os.path.join(torch_lib_dir, "c10.dll")
    try:
        ctypes.CDLL(c10_path)
        print("SUCCESS: Loaded c10.dll after libiomp5md.dll")
    except Exception as e:
        print(f"FAILED: Loaded c10.dll: {e}")

if __name__ == "__main__":
    test_load()

```

---
FILE: backend/test_ocr_saved.py

```python
"""
SENTINEL — Test EasyOCR on Saved Plate Crops
Loads saved license plate crops and runs the complete pre-processing and EasyOCR reader pipeline.
"""
import os
import sys
import cv2

# Ensure app directory is in Python path
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from app.config import PYTORCH_AVAILABLE, UPLOAD_DIR
from app.services.ocr_service import ocr_service

def test_ocr_on_saved_plates():
    print("=" * 60)
    print(" TESTING EASYOCR ON SAVED LICENSE PLATE CROPS ")
    print("=" * 60)
    
    if not PYTORCH_AVAILABLE:
        print("✗ PyTorch not available, cannot run real EasyOCR.")
        return
        
    ocr_service.load_model()
    
    # List plate images in uploads folder
    files = [f for f in os.listdir(UPLOAD_DIR) if f.startswith("plate_") and f.endswith(".jpg")]
    if not files:
        print("No plate images found in uploads folder to test.")
        return
        
    print(f"Found {len(files)} plate crops. Testing OCR on first 10 files...")
    
    success_count = 0
    total_tested = 0
    
    for filename in sorted(files)[:10]:
        filepath = os.path.join(UPLOAD_DIR, filename)
        img = cv2.imread(filepath)
        if img is None:
            continue
            
        total_tested += 1
        print(f"\nFile: {filename} (Dimensions: {img.shape[1]}x{img.shape[0]})")
        
        # Let's run the reader
        res = ocr_service.read_plate(img)
        if res:
            success_count += 1
            print(f"  ► OCR SUCCESS! Text: '{res['text']}' | Confidence: {res['confidence']:.2f}")
        else:
            print("  ► OCR returned no valid plate text.")
            
    print("\n" + "=" * 60)
    print(f"OCR TEST SUMMARY: {success_count}/{total_tested} successfully read.")
    print("=" * 60)

if __name__ == "__main__":
    test_ocr_on_saved_plates()

```

---
FILE: backend/test_pytorch.py

```python
import os
import zipfile
import pickle
import io

def extract_yolo_names_no_torch():
    model_path = os.path.join("models", "best.pt")
    if not os.path.exists(model_path):
        print(f"Model file not found at: {model_path}")
        return
        
    print(f"Attempting to extract YOLO class names directly from {model_path} zip structure...")
    try:
        with zipfile.ZipFile(model_path, 'r') as z:
            print("Files inside best.pt:")
            for name in z.namelist()[:10]:
                print(f"  {name}")
            
            pkl_files = [n for n in z.namelist() if n.endswith('.pkl') or 'pkl' in n or 'pickle' in n or 'data' in n]
            print(f"Pickle/data files found: {pkl_files}")
            
            # Simple Unpickler that maps unknown classes to strings/dicts
            class SafeUnpickler(pickle.Unpickler):
                def find_class(self, module, name):
                    # print(f"Loading class: {module}.{name}")
                    if module.startswith('torch'):
                        # Stub class to hold values
                        class TorchStub:
                            def __init__(self, *args, **kwargs):
                                self.args = args
                                self.kwargs = kwargs
                            def __repr__(self):
                                return f"<torch.{name}>"
                        return TorchStub
                    if 'ultralytics' in module:
                        class UltralyticsStub:
                            def __init__(self, *args, **kwargs):
                                self.args = args
                                self.kwargs = kwargs
                            def __repr__(self):
                                return f"<ultralytics.{name}>"
                        return UltralyticsStub
                    try:
                        return super().find_class(module, name)
                    except Exception:
                        class GenericStub:
                            def __init__(self, *args, **kwargs):
                                self.args = args
                                self.kwargs = kwargs
                            def __repr__(self):
                                return f"<{module}.{name}>"
                        return GenericStub

            for pkl_file in pkl_files:
                try:
                    data = z.read(pkl_file)
                    print(f"Reading {pkl_file} ({len(data)} bytes)...")
                    # Try to parse the model dictionary
                    unpickler = SafeUnpickler(io.BytesIO(data))
                    res = unpickler.load()
                    print(f"Parsed {pkl_file} successfully! Type: {type(res)}")
                    if isinstance(res, dict):
                        for k in res.keys():
                            print(f"  Key: {k}")
                            # Print names if found
                            if k == 'names':
                                print(f"  FOUND NAMES: {res['names']}")
                            # Print model metadata if found
                            if k == 'model':
                                m = res[k]
                                print(f"  Model type: {type(m)}")
                                if hasattr(m, 'names'):
                                    print(f"    Model Names: {getattr(m, 'names')}")
                                if isinstance(m, dict) and 'names' in m:
                                    print(f"    Model Names in dict: {m['names']}")
                                elif hasattr(m, '__dict__'):
                                    print(f"    Model keys: {m.__dict__.keys()}")
                                    if 'names' in m.__dict__:
                                        print(f"    Names in model __dict__: {m.__dict__['names']}")
                                    
                        # Sometimes YOLO model has 'names' nested in other keys, let's search:
                        for k, v in res.items():
                            if isinstance(v, dict) and 'names' in v:
                                print(f"  Nested 'names' in key '{k}': {v['names']}")
                            elif hasattr(v, '__dict__'):
                                if 'names' in v.__dict__:
                                    print(f"  Nested 'names' in key '{k}' __dict__: {v.__dict__['names']}")
                                    
                except Exception as e:
                    print(f"Could not parse pickle {pkl_file}: {e}")
                    import traceback
                    traceback.print_exc()
    except Exception as e:
        print(f"Zip extraction failed: {e}")

if __name__ == "__main__":
    extract_yolo_names_no_torch()

```

---
FILE: backend/test_realtime_stream.py

```python
import asyncio
import json
import logging
import websockets

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("test_realtime_stream")

async def test_stream():
    uri = "ws://127.0.0.1:8000/ws/live/8fad2bc9"
    logger.info(f"Connecting to {uri} ...")
    
    try:
        async with websockets.connect(uri) as ws:
            # 1. Wait for processing_started message
            init_msg = await ws.recv()
            init_data = json.loads(init_msg)
            logger.info(f"✓ Initial response: {init_data}")
            assert init_data["type"] == "processing_started"
            
            # 2. Receive first 5 frames and verify latency is present
            logger.info("Receiving 5 frames with AI Overlay Enabled...")
            for i in range(5):
                frame_msg = await ws.recv()
                frame_data = json.loads(frame_msg)
                if frame_data["type"] == "frame_update":
                    logger.info(
                        f"Frame {frame_data['current_frame']} | "
                        f"Detections: {len(frame_data['detections'])} | "
                        f"FPS: {frame_data['fps']} | "
                        f"Latency: {frame_data.get('latency')} ms | "
                        f"Frame Size: {len(frame_data['frame'])} chars"
                    )
                    assert "latency" in frame_data, "Latency must be present in payload"
                    assert frame_data["latency"] > 0, "Latency must be positive"
            
            # 3. Disable overlay dynamically
            logger.info("Sending 'disable_overlay' action to server...")
            await ws.send("disable_overlay")
            
            # Receive next 5 frames and verify latency and payload are still correct
            logger.info("Receiving 5 frames with AI Overlay Disabled...")
            for i in range(5):
                frame_msg = await ws.recv()
                frame_data = json.loads(frame_msg)
                if frame_data["type"] == "frame_update":
                    logger.info(
                        f"Frame {frame_data['current_frame']} (Raw) | "
                        f"Detections: {len(frame_data['detections'])} | "
                        f"Latency: {frame_data.get('latency')} ms"
                    )
            
            # 4. Enable overlay back dynamically
            logger.info("Sending 'enable_overlay' action to server...")
            await ws.send("enable_overlay")
            
            # Receive next 3 frames
            logger.info("Receiving 3 frames with AI Overlay Enabled again...")
            for i in range(3):
                frame_msg = await ws.recv()
                frame_data = json.loads(frame_msg)
                if frame_data["type"] == "frame_update":
                    logger.info(
                        f"Frame {frame_data['current_frame']} (Annotated) | "
                        f"Detections: {len(frame_data['detections'])} | "
                        f"Latency: {frame_data.get('latency')} ms"
                    )
            
            # 5. Send 'stop' and verify clean disconnect
            logger.info("Sending 'stop' command to server...")
            await ws.send("stop")
            
            # Verify clean loop exit or close
            try:
                final_msg = await asyncio.wait_for(ws.recv(), timeout=2.0)
                final_data = json.loads(final_msg)
                logger.info(f"Final received message: {final_data}")
            except asyncio.TimeoutError:
                logger.info("✓ Server closed loop after stop without sending additional frames")
            
            logger.info("✓ E2E Realtime Stream WebSocket Test completed successfully!")
            
    except Exception as e:
        logger.error(f"✗ E2E Realtime Stream WebSocket Test failed: {e}", exc_info=True)

if __name__ == "__main__":
    asyncio.run(test_stream())

```

---
FILE: backend/test_real_inference.py

```python
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

```

---
FILE: backend/test_tracker.py

```python
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

```

---
FILE: backend/test_upload.py

```python
import urllib.request
import json
import os

def run_test():
    # 1. Create a dummy test video file
    dummy_content = b"dummy video data for sentinel monitoring testing"
    filename = "test_traffic.mp4"
    with open(filename, "wb") as f:
        f.write(dummy_content)

    print(f"Created dummy file: {filename} ({len(dummy_content)} bytes)")

    # 2. Construct multipart/form-data payload
    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
    data = []
    data.append(f"--{boundary}".encode())
    data.append(f'Content-Disposition: form-data; name="file"; filename="{filename}"'.encode())
    data.append(b"Content-Type: video/mp4")
    data.append(b"")
    data.append(dummy_content)
    data.append(f"--{boundary}--".encode())
    data.append(b"")

    body = b"\r\n".join(data)

    print("Posting to http://127.0.0.1:8000/api/upload ...")
    req = urllib.request.Request("http://127.0.0.1:8000/api/upload", data=body)
    req.add_header("Content-Type", f"multipart/form-data; boundary={boundary}")
    req.add_header("Content-Length", len(body))

    try:
        with urllib.request.urlopen(req) as resp:
            status = resp.status
            res_data = json.loads(resp.read().decode())
            print(f"Success! HTTP Status: {status}")
            print("Response JSON:")
            print(json.dumps(res_data, indent=2))
    except Exception as e:
        import traceback
        print("API Call Failed:", e)
        traceback.print_exc()
        if hasattr(e, "read"):
            print("Server Response:", e.read().decode())

    # 3. Clean up the local dummy file
    if os.path.exists(filename):
        os.remove(filename)

if __name__ == "__main__":
    run_test()

```

---
FILE: README.md

```markdown
# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

```

---
