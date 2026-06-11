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
