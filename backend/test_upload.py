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
