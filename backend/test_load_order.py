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
