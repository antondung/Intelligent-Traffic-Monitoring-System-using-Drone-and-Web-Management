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
