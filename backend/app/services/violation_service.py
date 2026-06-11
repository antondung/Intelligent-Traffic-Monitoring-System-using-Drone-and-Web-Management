"""
SENTINEL — Violation Detection Service
Virtual spatial rules for traffic violation detection.
"""
import logging
import math
from typing import Any

from app.config import (
    VIOLATION_LANE_LINE,
    ALLOWED_DIRECTION,
    DIRECTION_MIN_DISPLACEMENT,
)

logger = logging.getLogger(__name__)


class ViolationService:
    """
    Detects traffic violations based on virtual spatial rules.
    Supports: wrong lane, opposite direction.
    """

    def __init__(self):
        # Per-track violation state to avoid duplicate alerts
        self._track_violations: dict[int, dict[str, bool]] = {}
        # Alert counter for unique IDs
        self._alert_counter = 0

    def check_violations(
        self,
        track_id: int,
        centroid: tuple[float, float],
        direction: tuple[float, float] | None,
        frame_width: int,
        frame_height: int,
    ) -> dict[str, Any] | None:
        """
        Check if a tracked vehicle is violating any traffic rules.

        Args:
            track_id: Unique track identifier
            centroid: (cx, cy) of the vehicle in pixel coordinates
            direction: (dx, dy) movement vector, or None if unknown
            frame_width: Width of the video frame
            frame_height: Height of the video frame

        Returns:
            {"type": "wrong_lane", "active": True} or None
        """
        if track_id not in self._track_violations:
            self._track_violations[track_id] = {
                "wrong_lane": False,
                "opposite_direction": False,
            }

        violation = None

        # ── Check wrong lane ─────────────────────────────
        wrong_lane = self._check_wrong_lane(centroid, frame_width, frame_height)
        if wrong_lane and not self._track_violations[track_id]["wrong_lane"]:
            self._track_violations[track_id]["wrong_lane"] = True
            violation = {"type": "wrong_lane", "active": True}

        # ── Check opposite direction ─────────────────────
        if direction is not None:
            opposite = self._check_opposite_direction(direction)
            if opposite and not self._track_violations[track_id]["opposite_direction"]:
                self._track_violations[track_id]["opposite_direction"] = True
                violation = {"type": "opposite_direction", "active": True}

        return violation

    def _check_wrong_lane(
        self,
        centroid: tuple[float, float],
        frame_width: int,
        frame_height: int,
    ) -> bool:
        """
        Check if the vehicle centroid is on the wrong side of the virtual lane line.
        The lane line divides the frame. Vehicles on the left side are considered
        to be in the wrong lane (configurable).
        """
        cx, cy = centroid

        # Convert lane line from normalized (0-1) to pixel coordinates
        line_start = (
            VIOLATION_LANE_LINE[0][0] * frame_width,
            VIOLATION_LANE_LINE[0][1] * frame_height,
        )
        line_end = (
            VIOLATION_LANE_LINE[1][0] * frame_width,
            VIOLATION_LANE_LINE[1][1] * frame_height,
        )

        # Use cross product to determine which side of the line the point is on
        # If cross product < 0, point is on the "wrong" side
        cross = (
            (line_end[0] - line_start[0]) * (cy - line_start[1])
            - (line_end[1] - line_start[1]) * (cx - line_start[0])
        )

        return cross < 0

    def _check_opposite_direction(self, direction: tuple[float, float]) -> bool:
        """
        Check if the vehicle is moving in the opposite direction to the allowed flow.
        Uses dot product: negative = opposite direction.
        """
        dx, dy = direction

        # Compute displacement magnitude
        magnitude = math.sqrt(dx * dx + dy * dy)
        if magnitude < DIRECTION_MIN_DISPLACEMENT:
            return False

        # Normalize
        dx_norm = dx / magnitude
        dy_norm = dy / magnitude

        # Dot product with allowed direction
        dot = dx_norm * ALLOWED_DIRECTION[0] + dy_norm * ALLOWED_DIRECTION[1]

        # If strongly opposite (dot < -0.5), it's a violation
        return dot < -0.5

    def generate_alert(self, violation_type: str, track_id: int) -> dict[str, Any]:
        """Generate a violation alert message."""
        self._alert_counter += 1

        messages = {
            "wrong_lane": f"Wrong lane detected — Vehicle #{track_id}",
            "opposite_direction": f"Opposite direction detected — Vehicle #{track_id}",
        }
        severities = {
            "wrong_lane": "high",
            "opposite_direction": "critical",
        }

        return {
            "id": f"alert_{self._alert_counter:04d}",
            "message": messages.get(violation_type, f"Violation: {violation_type}"),
            "severity": severities.get(violation_type, "medium"),
        }

    def cleanup_track(self, track_id: int) -> None:
        """Remove violation state for a deregistered track."""
        self._track_violations.pop(track_id, None)

    def reset(self) -> None:
        """Reset all violation state."""
        self._track_violations.clear()
        self._alert_counter = 0


# Global singleton
violation_service = ViolationService()
