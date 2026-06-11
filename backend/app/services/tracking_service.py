import logging
from typing import Any
from collections import defaultdict

import numpy as np

from app.config import TRACKER_MAX_AGE, TRACKER_MIN_HITS, PYTORCH_AVAILABLE

logger = logging.getLogger(__name__)


class CentroidTracker:
    """
    Highly robust CPU-based Centroid Tracker to map detection bounding boxes
    across frames deterministically when PyTorch/supervision is unavailable.
    Optimized for production tracking stability, smooth rendering, and zero-flicker labels.
    """

    def __init__(self, max_disappeared: int = 30):
        self.next_object_id = 1
        self.objects: dict[int, np.ndarray] = {}
        self.bboxes: dict[int, dict[str, int]] = {}
        self.classes: dict[int, str] = {}
        self.confidences: dict[int, float] = {}
        self.disappeared: dict[int, int] = {}
        self.max_disappeared = max_disappeared
        
        # Stability components
        self.hits: dict[int, int] = {}
        self.classes_history: dict[int, list[str]] = defaultdict(list)
        self.smooth_bboxes: dict[int, dict[str, int]] = {}

    def register(self, centroid: np.ndarray, bbox: dict[str, int], cls_name: str, conf: float) -> None:
        self.objects[self.next_object_id] = centroid
        self.bboxes[self.next_object_id] = bbox
        self.classes[self.next_object_id] = cls_name
        self.confidences[self.next_object_id] = conf
        self.disappeared[self.next_object_id] = 0
        
        # Initialize stability stats
        self.hits[self.next_object_id] = 1
        self.classes_history[self.next_object_id] = [cls_name]
        self.smooth_bboxes[self.next_object_id] = bbox
        
        self.next_object_id += 1

    def deregister(self, object_id: int) -> None:
        self.objects.pop(object_id, None)
        self.bboxes.pop(object_id, None)
        self.classes.pop(object_id, None)
        self.confidences.pop(object_id, None)
        self.disappeared.pop(object_id, None)
        self.hits.pop(object_id, None)
        self.classes_history.pop(object_id, None)
        self.smooth_bboxes.pop(object_id, None)

    def update(self, rects: list[dict[str, Any]]) -> list[dict[str, Any]]:
        from collections import Counter
        
        if len(rects) == 0:
            for object_id in list(self.disappeared.keys()):
                self.disappeared[object_id] += 1
                if self.disappeared[object_id] > self.max_disappeared:
                    self.deregister(object_id)
            return []

        input_centroids = np.zeros((len(rects), 2), dtype="int")
        for i, r in enumerate(rects):
            x1, y1, x2, y2 = r["bbox"]["x1"], r["bbox"]["y1"], r["bbox"]["x2"], r["bbox"]["y2"]
            cx = int((x1 + x2) / 2.0)
            cy = int((y1 + y2) / 2.0)
            input_centroids[i] = (cx, cy)

        if len(self.objects) == 0:
            for i in range(len(rects)):
                self.register(input_centroids[i], rects[i]["bbox"], rects[i]["class"], rects[i]["confidence"])
        else:
            object_ids = list(self.objects.keys())
            object_centroids = list(self.objects.values())

            D = np.linalg.norm(np.array(object_centroids)[:, np.newaxis] - input_centroids, axis=2)

            rows = D.min(axis=1).argsort()
            cols = D.argmin(axis=1)[rows]

            used_rows = set()
            used_cols = set()

            for row, col in zip(rows, cols):
                if row in used_rows or col in used_cols:
                    continue

                if D[row, col] > 180:  # Pixel threshold distance to match existing object
                    continue

                object_id = object_ids[row]
                self.objects[object_id] = input_centroids[col]
                self.disappeared[object_id] = 0
                self.hits[object_id] += 1
                
                # Bounding box smoothing (EMA filter)
                prev_bbox = self.smooth_bboxes.get(object_id, rects[col]["bbox"])
                alpha = 0.40  # coordinates smoothing weight
                curr_bbox = rects[col]["bbox"]
                smoothed_bbox = {
                    "x1": int(alpha * curr_bbox["x1"] + (1 - alpha) * prev_bbox["x1"]),
                    "y1": int(alpha * curr_bbox["y1"] + (1 - alpha) * prev_bbox["y1"]),
                    "x2": int(alpha * curr_bbox["x2"] + (1 - alpha) * prev_bbox["x2"]),
                    "y2": int(alpha * curr_bbox["y2"] + (1 - alpha) * prev_bbox["y2"]),
                }
                self.smooth_bboxes[object_id] = smoothed_bbox
                self.bboxes[object_id] = smoothed_bbox
                
                # Class label history and locking majority vote
                self.classes_history[object_id].append(rects[col]["class"])
                if len(self.classes_history[object_id]) > 15:
                    self.classes_history[object_id].pop(0)
                
                # Latch to the stable category
                cls_counts = Counter(self.classes_history[object_id])
                self.classes[object_id] = cls_counts.most_common(1)[0][0]
                self.confidences[object_id] = rects[col]["confidence"]

                used_rows.add(row)
                used_cols.add(col)

            unused_rows = set(range(0, D.shape[0])).difference(used_rows)
            unused_cols = set(range(0, D.shape[1])).difference(used_cols)

            for row in unused_rows:
                object_id = object_ids[row]
                self.disappeared[object_id] += 1
                if self.disappeared[object_id] > self.max_disappeared:
                    self.deregister(object_id)

            for col in unused_cols:
                self.register(input_centroids[col], rects[col]["bbox"], rects[col]["class"], rects[col]["confidence"])

        tracked_results = []
        tracked_results = []
        for oid in self.objects.keys():
            # Confirm tracks immediately (hits >= 1) to prevent initial frame discard
            if self.hits.get(oid, 0) >= 1:
                tracked_results.append({
                    "class": self.classes[oid],
                    "confidence": self.confidences[oid],
                    "bbox": self.bboxes[oid],
                    "track_id": oid,
                })
        return tracked_results


class ByteTrackTracker:
    """
    ByteTrack-based multi-object tracker using the supervision library
    with CPU-based Centroid Tracker fallback.
    """

    def __init__(
        self,
        max_age: int = TRACKER_MAX_AGE,
        min_hits: int = TRACKER_MIN_HITS,
    ):
        self._centroid_tracker = CentroidTracker(max_disappeared=max_age)
        if PYTORCH_AVAILABLE:
            try:
                import supervision as sv
                self._tracker = sv.ByteTrack(
                    track_activation_threshold=0.25,
                    lost_track_buffer=max_age,
                    minimum_matching_threshold=0.8,
                    frame_rate=12,
                    minimum_consecutive_frames=min_hits,
                )
            except Exception as e:
                logger.error("Failed to initialize ByteTrack via supervision: %s", e)
                self._tracker = None

        # Store centroids per track for direction computation
        self._prev_centroids: dict[int, np.ndarray] = {}
        self._curr_centroids: dict[int, np.ndarray] = {}
        
        # Track classification cache to prevent label flipping
        self._track_classes: dict[int, str] = {}

    def update(self, detections: list[dict[str, Any]]) -> list[dict[str, Any]]:
        """
        Updates the tracker with YOLO detections.
        Tries supervision ByteTrack first (if active), then CentroidTracker, and finally
        falls back to stable raw detections index tracking.
        """
        if not detections:
            return []

        results = []
        tracker_used = "None"

        # Ensure fallback centroid tracker is always available
        if not hasattr(self, "_centroid_tracker") or self._centroid_tracker is None:
            self._centroid_tracker = CentroidTracker(max_disappeared=TRACKER_MAX_AGE)

        # Tier 1: supervision ByteTrack
        if hasattr(self, "_tracker") and self._tracker is not None:
            try:
                import supervision as sv
                
                # Build supervision Detections
                xyxy = np.array([
                    [d["bbox"]["x1"], d["bbox"]["y1"], d["bbox"]["x2"], d["bbox"]["y2"]]
                    for d in detections
                ], dtype=np.float32)
                
                confidences = np.array([d["confidence"] for d in detections], dtype=np.float32)
                
                from app.services.yolo_service import yolo_service
                try:
                    names = yolo_service.model.names
                    class_name_to_id = {v.lower(): k for k, v in names.items()}
                except Exception:
                    class_name_to_id = {"car": 0, "motorbike": 1, "truck": 2, "bus": 3}
                
                class_ids = np.array([
                    class_name_to_id.get(d["class"].lower(), 0) for d in detections
                ], dtype=int)
                
                sv_detections = sv.Detections(
                    xyxy=xyxy,
                    confidence=confidences,
                    class_id=class_ids,
                )
                
                tracked = self._tracker.update_with_detections(sv_detections)
                
                if len(tracked) > 0:
                    for i in range(len(tracked)):
                        track_id = int(tracked.tracker_id[i])
                        bbox_arr = tracked.xyxy[i]
                        original_det = self._find_matching_detection(
                            detections, bbox_arr, tracked.confidence[i] if tracked.confidence is not None else 0.0
                        )
                        
                        if original_det:
                            class_name = original_det.get("class", "car")
                            self._track_classes[track_id] = class_name
                        else:
                            class_name = self._track_classes.get(track_id, "car")
                            
                        results.append({
                            "class": class_name,
                            "confidence": round(float(tracked.confidence[i]) if tracked.confidence is not None else 0.0, 4),
                            "bbox": {
                                "x1": int(bbox_arr[0]),
                                "y1": int(bbox_arr[1]),
                                "x2": int(bbox_arr[2]),
                                "y2": int(bbox_arr[3]),
                            },
                            "track_id": track_id,
                        })
                    tracker_used = "ByteTrack"
            except Exception as e:
                logger.warning("ByteTrack update failed, falling back to CentroidTracker: %s", e)

        # Tier 2: CentroidTracker fallback
        if not results:
            try:
                results = self._centroid_tracker.update(detections)
                if results:
                    tracker_used = "CentroidTracker"
            except Exception as e:
                logger.warning("CentroidTracker update failed, falling back to raw detections: %s", e)

        # Tier 3: Raw fallback (ensure we NEVER discard detections)
        if not results:
            for idx, det in enumerate(detections):
                d = dict(det)
                d["track_id"] = idx + 1
                results.append(d)
            tracker_used = "RawFallback"

        # Update centroids registry for speed & direction telemetry
        for tr in results:
            track_id = tr["track_id"]
            bbox = tr["bbox"]
            cx = (bbox["x1"] + bbox["x2"]) / 2.0
            cy = (bbox["y1"] + bbox["y2"]) / 2.0
            centroid = np.array([cx, cy])

            if track_id in self._curr_centroids:
                self._prev_centroids[track_id] = self._curr_centroids[track_id].copy()
            self._curr_centroids[track_id] = centroid

        return results

        if not detections:
            import supervision as sv
            empty_det = sv.Detections.empty()
            self._tracker.update_with_detections(empty_det)
            return []

        import supervision as sv
        # Build supervision Detections object from our detection list
        xyxy = np.array([
            [d["bbox"]["x1"], d["bbox"]["y1"], d["bbox"]["x2"], d["bbox"]["y2"]]
            for d in detections
        ], dtype=np.float32)

        confidences = np.array([d["confidence"] for d in detections], dtype=np.float32)

        # Class IDs — map class names to integer indices dynamically from yolo_service model names
        from app.services.yolo_service import yolo_service
        try:
            names = yolo_service.model.names
            class_name_to_id = {v.lower(): k for k, v in names.items()}
        except Exception:
            class_name_to_id = {"car": 0, "motorbike": 1, "truck": 2, "bus": 3}

        class_ids = np.array([
            class_name_to_id.get(d["class"].lower(), 0) for d in detections
        ], dtype=int)

        sv_detections = sv.Detections(
            xyxy=xyxy,
            confidence=confidences,
            class_id=class_ids,
        )

        # Run ByteTrack update
        tracked = self._tracker.update_with_detections(sv_detections)

        if len(tracked) == 0:
            return []

        # Build enriched detection results with track IDs
        results: list[dict[str, Any]] = []

        # Map tracked detections back to our format
        for i in range(len(tracked)):
            track_id = int(tracked.tracker_id[i])
            bbox_arr = tracked.xyxy[i]

            # Find the original detection that best matches this tracked bbox
            original_det = self._find_matching_detection(
                detections, bbox_arr, tracked.confidence[i] if tracked.confidence is not None else 0.0
            )

            # Compute centroid
            cx = (bbox_arr[0] + bbox_arr[2]) / 2.0
            cy = (bbox_arr[1] + bbox_arr[3]) / 2.0
            centroid = np.array([cx, cy])

            # Store previous centroid for direction computation
            if track_id in self._curr_centroids:
                self._prev_centroids[track_id] = self._curr_centroids[track_id].copy()
            self._curr_centroids[track_id] = centroid

            # Class stability logic using caching
            if original_det:
                class_name = original_det.get("class", "car")
                self._track_classes[track_id] = class_name
            else:
                class_name = self._track_classes.get(track_id, "car")

            det_result = {
                "class": class_name,
                "confidence": round(float(tracked.confidence[i]) if tracked.confidence is not None else 0.0, 4),
                "bbox": {
                    "x1": int(bbox_arr[0]),
                    "y1": int(bbox_arr[1]),
                    "x2": int(bbox_arr[2]),
                    "y2": int(bbox_arr[3]),
                },
                "track_id": track_id,
            }
            results.append(det_result)

        return results

    def _find_matching_detection(
        self,
        detections: list[dict[str, Any]],
        bbox: np.ndarray,
        confidence: float,
    ) -> dict[str, Any] | None:
        """Find the original detection that best matches a tracked bounding box."""
        best_match = None
        best_iou = 0.0

        for det in detections:
            db = det["bbox"]
            det_bbox = np.array([db["x1"], db["y1"], db["x2"], db["y2"]], dtype=np.float32)

            # Compute IoU
            x1 = max(bbox[0], det_bbox[0])
            y1 = max(bbox[1], det_bbox[1])
            x2 = min(bbox[2], det_bbox[2])
            y2 = min(bbox[3], det_bbox[3])

            intersection = max(0, x2 - x1) * max(0, y2 - y1)
            area1 = (bbox[2] - bbox[0]) * (bbox[3] - bbox[1])
            area2 = (det_bbox[2] - det_bbox[0]) * (det_bbox[3] - det_bbox[1])
            union = area1 + area2 - intersection

            iou = intersection / union if union > 0 else 0

            if iou > best_iou:
                best_iou = iou
                best_match = det

        return best_match

    def get_direction(self, track_id: int) -> tuple[float, float] | None:
        """
        Get the movement direction vector for a tracked object.
        Returns (dx, dy) or None if not enough history.
        """
        if track_id not in self._curr_centroids or track_id not in self._prev_centroids:
            return None

        current = self._curr_centroids[track_id]
        previous = self._prev_centroids[track_id]
        dx = float(current[0] - previous[0])
        dy = float(current[1] - previous[1])
        return (dx, dy)

    def get_centroid(self, track_id: int) -> tuple[float, float] | None:
        """Get current centroid of a tracked object."""
        if track_id not in self._curr_centroids:
            return None
        c = self._curr_centroids[track_id]
        return (float(c[0]), float(c[1]))

    @property
    def active_track_count(self) -> int:
        return len(self._curr_centroids)


class TrackingService:
    """Wrapper that manages tracker instances per session."""

    def __init__(self):
        self._trackers: dict[str, ByteTrackTracker] = {}

    def get_tracker(self, session_id: str) -> ByteTrackTracker:
        """Get or create a tracker for a given session."""
        if session_id not in self._trackers:
            self._trackers[session_id] = ByteTrackTracker()
        return self._trackers[session_id]

    def remove_tracker(self, session_id: str) -> None:
        """Clean up tracker for a session."""
        self._trackers.pop(session_id, None)


# Global singleton
tracking_service = TrackingService()
