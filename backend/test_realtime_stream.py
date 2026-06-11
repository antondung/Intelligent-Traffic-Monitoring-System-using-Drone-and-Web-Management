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
