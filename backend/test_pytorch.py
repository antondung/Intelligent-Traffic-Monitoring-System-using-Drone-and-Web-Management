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
