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
