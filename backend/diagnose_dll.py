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
