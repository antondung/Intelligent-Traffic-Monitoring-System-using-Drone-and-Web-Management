"""
SENTINEL — Video Processing Pipeline
Orchestrates frame-by-frame AI processing: YOLO → ByteTrack → OCR → Violations.
Streams real-time results (frames, detections, statistics, FPS, progress) via WebSocket.
"""
import asyncio
import logging
import time
from collections import deque
from typing import Any

import cv2
import numpy as np

from fastapi import WebSocket
from app.config import MAX_FPS, OCR_FRAME_INTERVAL, FRAME_RESIZE_WIDTH, HARD_DEBUG_MODE
from app.services.yolo_service import yolo_service
from app.services.tracking_service import tracking_service
from app.services.ocr_service import ocr_service
from app.services.violation_service import ViolationService
from app.utils.image_utils import frame_to_base64, resize_frame, crop_bbox, draw_detections
from app.utils.video_utils import get_video_info, compute_frame_skip

logger = logging.getLogger(__name__)


class VideoProcessor:
    """
    Processes uploaded video through the full AI pipeline and streams
    results via WebSocket.
    """

    def __init__(self, session_id: str, video_path: str, websocket: WebSocket):
        self.session_id = session_id
        self.video_path = video_path
        self.websocket = websocket
        self.is_running = False
        self._frame_count = 0

        # Per-session services
        self.tracker = tracking_service.get_tracker(session_id)
        self.violation_svc = ViolationService()

        # Statistics accumulator
        self.stats = {
            "total_vehicles": 0,
            "car": 0,
            "motorbike": 0,
            "truck": 0,
            "bus": 0,
            "person": 0,
            "bicycle": 0,
        }
        # Set of confirmed track IDs (to avoid double-counting)
        self._counted_tracks: set[int] = set()

        # OCR results cache: track_id -> plate info
        self._plate_cache: dict[int, dict] = {}
        # Track last OCR frame per track
        self._ocr_last_frame: dict[int, int] = {}

        # Support dynamic overlay toggling
        self.ai_overlay = True

        # Real FPS computation (rolling window)
        self._frame_times: deque[float] = deque(maxlen=30)
        self._current_fps: float = 0.0

        # Video metadata (populated in process())
        self._total_frames: int = 0
        self._processed_frames: int = 0
        self._start_time: float = 0.0

    async def process(self) -> None:
        """
        Main processing loop. Reads video frame-by-frame, runs AI pipeline,
        and streams results directly via WebSocket.
        """
        self.is_running = True
        cap = cv2.VideoCapture(self.video_path)

        if not cap.isOpened():
            logger.error("Cannot open video: %s", self.video_path)
            try:
                await self._send_error("Cannot open video file")
            except Exception:
                pass
            return

        try:
            video_info = get_video_info(self.video_path)
            source_fps = video_info["fps"] or 30
            self._total_frames = video_info["total_frames"]
            frame_skip = compute_frame_skip(source_fps, MAX_FPS)
            target_delay = 1.0 / MAX_FPS
            self._start_time = time.time()

            logger.info(
                "Starting processing: session=%s, fps=%s, skip=%d, target_fps=%d, total_frames=%d",
                self.session_id, source_fps, frame_skip, MAX_FPS, self._total_frames,
            )
            print("[VIDEO LOOP ACTIVE] Started uvicorn processor frame loop", flush=True)

            frame_idx = 0

            while self.is_running and cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    if HARD_DEBUG_MODE:
                        print("[VIDEO] frame read EOF or failed, loop exited cleanly", flush=True)
                    # Video ended — send completion message
                    try:
                        await self._send_completion()
                    except Exception:
                        pass
                    break

                frame_idx += 1
                print(f"[FRAME READ SUCCESS] Frame index {frame_idx} read from capture", flush=True)

                # Skip frames to match target FPS
                if frame_idx % frame_skip != 0:
                    continue

                print(f"[FRAME IDX] {frame_idx}", flush=True)

                if HARD_DEBUG_MODE:
                    print(f"[VIDEO] frame read success, index={frame_idx}", flush=True)

                frame_start = time.time()

                # Process this frame through the AI pipeline
                message = await self._process_frame(frame, frame_idx)

                # Compute real FPS
                frame_elapsed = time.time() - frame_start
                self._frame_times.append(frame_elapsed)
                if len(self._frame_times) > 1:
                    avg_time = sum(self._frame_times) / len(self._frame_times)
                    self._current_fps = 1.0 / avg_time if avg_time > 0 else 0.0

                # Update processed frame count
                self._processed_frames += 1

                if message:
                    # Inject real-time metrics into the message
                    message["fps"] = round(self._current_fps, 1)
                    message["processing_progress"] = round(
                        (frame_idx / self._total_frames * 100) if self._total_frames > 0 else 0, 1
                    )
                    message["current_frame"] = frame_idx
                    message["total_frames"] = self._total_frames

                    try:
                        print(f"[FRAME INDEX] {frame_idx}", flush=True)
                        print(f"[YOLO DETECTIONS] {len(message['detections'])} vehicles", flush=True)
                        if HARD_DEBUG_MODE:
                            print(f"[WS SEND] Sending frame {frame_idx} with {len(message['detections'])} detections, {len(message['ocr_results'])} OCR results", flush=True)
                        
                        # Direct async send - MUST NEVER run inside asyncio.to_thread on Windows!
                        await self.websocket.send_json(message)
                        print(f"[FRAME SENT] Frame index {frame_idx} sent successfully", flush=True)
                        print(f"[WS SEND OK] WebSocket send success for frame {frame_idx}", flush=True)
                        
                        if HARD_DEBUG_MODE:
                            print(f"[WS SUCCESS] frame send success for index={frame_idx}", flush=True)
                    except (WebSocketDisconnect, ConnectionError) as ws_err:
                        if HARD_DEBUG_MODE:
                            print(f"[WS ERROR] client disconnected during send: {ws_err}", flush=True)
                        self.is_running = False
                        break
                    except OSError as ws_err:
                        if ws_err.errno == 22:
                            if HARD_DEBUG_MODE:
                                print(f"[WS ERROR] client disconnected during send (Errno 22)", flush=True)
                            self.is_running = False
                            break
                        else:
                            raise ws_err

                # Rate limiting — maintain target FPS
                elapsed = time.time() - frame_start
                sleep_time = max(0, target_delay - elapsed)
                if sleep_time > 0:
                    await asyncio.sleep(sleep_time)

        except (WebSocketDisconnect, ConnectionError) as e:
            logger.info("WebSocket disconnected for session: %s", self.session_id)
            if HARD_DEBUG_MODE:
                print(f"[WS ERROR] client disconnected: {e}", flush=True)
        except OSError as e:
            if e.errno == 22:
                logger.info("WebSocket disconnected for session (Errno 22): %s", self.session_id)
                if HARD_DEBUG_MODE:
                    print("[WS ERROR] client disconnected (Errno 22)", flush=True)
            else:
                logger.error("OS Error in process loop: %s", e, exc_info=True)
                if HARD_DEBUG_MODE:
                    import traceback
                    traceback.print_exc()
                try:
                    await self._send_error(str(e))
                except Exception:
                    pass
        except Exception as e:
            logger.error("Processing error in frame loop: %s", e, exc_info=True)
            if HARD_DEBUG_MODE:
                import traceback
                traceback.print_exc()
            try:
                await self._send_error(str(e))
            except Exception:
                pass
        finally:
            cap.release()
            self.is_running = False
            tracking_service.remove_tracker(self.session_id)
            logger.info("Processing complete for session: %s", self.session_id)

    async def _process_frame(self, frame: np.ndarray, frame_idx: int) -> dict[str, Any] | None:
        """
        Run the full AI pipeline on a single frame:
        1. Resize
        2. YOLO detection
        3. ByteTrack tracking
        4. OCR (throttled)
        5. Violation checks
        6. Draw annotations
        7. Encode + assemble message
        """
        pipeline_start = time.time()
        self._frame_count += 1

        # 1. Resize for faster processing
        try:
            processed = resize_frame(frame, FRAME_RESIZE_WIDTH)
            h, w = processed.shape[:2]
        except Exception as e:
            logger.error("Failed to resize frame %d: %s", frame_idx, e)
            return None

        # Prepare default fallback message in case of downstream pipeline failures
        fallback_msg = None
        try:
            # Verify frame is numpy ndarray and has correct size/shape
            if not isinstance(processed, np.ndarray) or processed.size == 0 or len(processed.shape) < 2 or processed.shape[0] <= 0 or processed.shape[1] <= 0:
                print(f"[ENCODE] JPEG encode failed on frame {frame_idx}: invalid type or shape", flush=True)
                return None

            # Prepare fallback frame encoding in case of downstream failures
            frame_b64 = frame_to_base64(processed)
            fallback_msg = {
                "type": "frame_update",
                "timestamp": int(time.time()),
                "frame": frame_b64,
                "detections": [],
                "statistics": dict(self.stats),
                "alerts": [],
                "ocr_results": [],
                "latency": round((time.time() - pipeline_start) * 1000, 1),
            }
            if HARD_DEBUG_MODE:
                print(f"[ENCODE] JPEG encode success (fallback) on frame {frame_idx}", flush=True)
        except Exception as e:
            logger.error("Failed to encode fallback frame %d: %s", frame_idx, e)
            print(f"[ENCODE] JPEG encode failed on frame {frame_idx}: {e}", flush=True)
            return None

        try:
            # 2. YOLO detection (run in a background thread to keep WebSocket loop responsive)
            if HARD_DEBUG_MODE:
                print(f"[FRAME] Processing frame {frame_idx}", flush=True)
            raw_detections = await asyncio.to_thread(yolo_service.detect, processed)
            if HARD_DEBUG_MODE:
                print(f"[YOLO] Raw detections: {len(raw_detections)}", flush=True)

            # 3. Update ByteTrack tracker (run in a background thread)
            try:
                tracked_detections = await asyncio.to_thread(self.tracker.update, raw_detections)
                if HARD_DEBUG_MODE:
                    print(f"[TRACKER] Tracked count: {len(tracked_detections)}", flush=True)
            except Exception as tracker_err:
                logger.error("Tracker update threw an exception on frame %d: %s", frame_idx, tracker_err, exc_info=True)
                if HARD_DEBUG_MODE:
                    import traceback
                    traceback.print_exc()
                # Dynamic tracker fallback to raw detections
                tracked_detections = []
                for idx, det in enumerate(raw_detections):
                    d = dict(det)
                    d["track_id"] = idx + 1
                    tracked_detections.append(d)
                if HARD_DEBUG_MODE:
                    print(f"[TRACKER] Fallback raw detections count: {len(tracked_detections)}", flush=True)

            # 4. Enrich detections with OCR and violation info
            alerts: list[dict] = []
            enriched_detections: list[dict] = []
            ocr_results: list[dict] = []

            violation_triggers = []

            for det in tracked_detections:
                track_id = det.get("track_id", 0)
                bbox = det["bbox"]

                # ── Plate Detection & OCR (throttled per track) ──
                plate_info = self._plate_cache.get(track_id)
                last_ocr = self._ocr_last_frame.get(track_id, -OCR_FRAME_INTERVAL)

                if plate_info is None and (self._frame_count - last_ocr) >= OCR_FRAME_INTERVAL:
                    # 1. Crop vehicle ROI
                    vehicle_crop = crop_bbox(processed, bbox, padding=5)
                    if vehicle_crop is not None and vehicle_crop.size > 0:
                        # 2. Detect Plate ROI inside vehicle ROI in background thread
                        from app.services.plate_detector import plate_detector_service
                        plate_det = await asyncio.to_thread(
                            plate_detector_service.detect_plate, vehicle_crop
                        )
                        if plate_det:
                            # Save cropped plate image to UPLOAD_DIR
                            from app.config import UPLOAD_DIR
                            plate_filename = f"plate_{self.session_id}_{track_id}.jpg"
                            plate_filepath = UPLOAD_DIR / plate_filename
                            await asyncio.to_thread(cv2.imwrite, str(plate_filepath), plate_det["cropped_plate"])

                            # 3. Read plate text from preprocessed plate crop in background thread
                            plate_result = await asyncio.to_thread(
                                ocr_service.read_plate, plate_det["cropped_plate"]
                            )
                            if plate_result:
                                plate_result["plate_url"] = f"/uploads/{plate_filename}"
                                self._plate_cache[track_id] = plate_result
                                plate_info = plate_result
                                ocr_results.append({
                                    "track_id": track_id,
                                    "text": plate_result["text"],
                                    "confidence": plate_result["confidence"],
                                    "vehicle_class": det.get("class", "unknown"),
                                    "plate_url": plate_result["plate_url"],
                                })
                    self._ocr_last_frame[track_id] = self._frame_count

                # ── Violation check ──
                centroid = (
                    (bbox["x1"] + bbox["x2"]) / 2.0,
                    (bbox["y1"] + bbox["y2"]) / 2.0,
                )
                direction = self.tracker.get_direction(track_id)
                violation = self.violation_svc.check_violations(
                    track_id, centroid, direction, w, h
                )

                if violation:
                    alert = self.violation_svc.generate_alert(violation["type"], track_id)
                    alerts.append(alert)

                    # Make sure plate image is generated right now if not already in cache
                    if not plate_info:
                        vehicle_crop = crop_bbox(processed, bbox, padding=5)
                        if vehicle_crop is not None and vehicle_crop.size > 0:
                            from app.services.plate_detector import plate_detector_service
                            plate_det = await asyncio.to_thread(
                                plate_detector_service.detect_plate, vehicle_crop
                            )
                            if plate_det:
                                from app.config import UPLOAD_DIR
                                plate_filename = f"plate_{self.session_id}_{track_id}.jpg"
                                plate_filepath = UPLOAD_DIR / plate_filename
                                await asyncio.to_thread(cv2.imwrite, str(plate_filepath), plate_det["cropped_plate"])

                                plate_result = await asyncio.to_thread(
                                    ocr_service.read_plate, plate_det["cropped_plate"]
                                )
                                if plate_result:
                                    plate_result["plate_url"] = f"/uploads/{plate_filename}"
                                    self._plate_cache[track_id] = plate_result
                                    plate_info = plate_result
                                else:
                                    plate_info = {
                                        "text": None,
                                        "confidence": 0.0,
                                        "plate_url": f"/uploads/{plate_filename}"
                                    }
                                    self._plate_cache[track_id] = plate_info

                    violation_triggers.append((track_id, violation))

                # ── Update statistics (support dynamic classes) ──
                if track_id not in self._counted_tracks:
                    self._counted_tracks.add(track_id)
                    cls_name = det.get("class", "car")
                    self.stats["total_vehicles"] += 1
                    if cls_name not in self.stats:
                        self.stats[cls_name] = 0
                    self.stats[cls_name] += 1

                # ── Build enriched detection ──
                enriched = {
                    "track_id": track_id,
                    "class": det.get("class", "unknown"),
                    "confidence": det.get("confidence", 0),
                    "bbox": bbox,
                    "plate": {
                        "text": plate_info["text"] if plate_info else None,
                        "confidence": plate_info["confidence"] if plate_info else 0.0,
                        "plate_url": plate_info.get("plate_url") if plate_info else None,
                     },
                    "violation": violation if violation else {"type": None, "active": False},
                }
                enriched_detections.append(enriched)

            # 5. Draw annotations on frame
            annotated = draw_detections(processed, enriched_detections)

            # 5b. Save violation snapshots for any newly triggered violations
            from app.config import UPLOAD_DIR
            for track_id, violation in violation_triggers:
                snapshot_filename = f"evidence_{self.session_id}_{track_id}_{violation['type']}.jpg"
                snapshot_filepath = UPLOAD_DIR / snapshot_filename
                await asyncio.to_thread(cv2.imwrite, str(snapshot_filepath), annotated)

                snapshot_url = f"/uploads/{snapshot_filename}"
                plate_url = None
                plate_info = self._plate_cache.get(track_id)
                if plate_info and "plate_url" in plate_info:
                    plate_url = plate_info["plate_url"]

                # Update enriched detections in place
                for d_i in enriched_detections:
                    if d_i["track_id"] == track_id:
                        d_i["violation"]["snapshot_url"] = snapshot_url
                        d_i["violation"]["plate_url"] = plate_url

            # Determine frame to encode (annotated if AI overlay is enabled, raw otherwise)
            display_frame = annotated if self.ai_overlay else processed

            # 6. Encode frame to base64
            try:
                if not isinstance(display_frame, np.ndarray) or display_frame.size == 0 or len(display_frame.shape) < 2 or display_frame.shape[0] <= 0 or display_frame.shape[1] <= 0:
                    raise ValueError("invalid type or shape")
                frame_b64 = frame_to_base64(display_frame)
                if HARD_DEBUG_MODE:
                    print(f"[ENCODE] JPEG encode success on frame {frame_idx}", flush=True)
            except Exception as e:
                print(f"[ENCODE] JPEG encode failed on frame {frame_idx}: {e}", flush=True)
                logger.error("Failed to encode display frame %d: %s", frame_idx, e)
                return fallback_msg

            # 7. Assemble WebSocket message
            message = {
                "type": "frame_update",
                "timestamp": int(time.time()),
                "frame": frame_b64,
                "detections": enriched_detections,
                "statistics": dict(self.stats),
                "alerts": alerts,
                "ocr_results": ocr_results,
                "latency": round((time.time() - pipeline_start) * 1000, 1),
            }

            if HARD_DEBUG_MODE:
                print(f"[OCR] OCR count: {len(ocr_results)}", flush=True)

            return message

        except Exception as e:
            logger.error("Inference exception during pipeline execution on frame %d: %s", frame_idx, e, exc_info=True)
            if HARD_DEBUG_MODE:
                import traceback
                traceback.print_exc()
            # Return fallback unannotated frame message instead of crashing
            return fallback_msg

    async def _send_completion(self) -> None:
        """Send video processing completion message."""
        elapsed = time.time() - self._start_time if self._start_time else 0
        try:
            await self.websocket.send_json({
                "type": "processing_complete",
                "timestamp": int(time.time()),
                "statistics": dict(self.stats),
                "processing_duration": round(elapsed, 1),
                "total_frames_processed": self._processed_frames,
                "average_fps": round(self._current_fps, 1),
                "message": "Video processing complete",
            })
        except Exception as e:
            logger.warning("Failed to send completion message: %s", e)

    async def _send_error(self, error: str) -> None:
        """Send error message to client."""
        try:
            await self.websocket.send_json({
                "type": "error",
                "timestamp": int(time.time()),
                "message": error,
            })
        except Exception:
            pass

    def stop(self) -> None:
        """Stop processing."""
        self.is_running = False


# Active processors registry
_active_processors: dict[str, VideoProcessor] = {}


def get_processor(session_id: str) -> VideoProcessor | None:
    return _active_processors.get(session_id)


def register_processor(session_id: str, processor: VideoProcessor) -> None:
    # If there's an existing processor, terminate it immediately!
    existing = _active_processors.get(session_id)
    if existing:
        existing.stop()
        logger.info("Terminated existing duplicate processor for session: %s", session_id)
    _active_processors[session_id] = processor


def remove_processor(session_id: str) -> None:
    proc = _active_processors.pop(session_id, None)
    if proc:
        proc.stop()
