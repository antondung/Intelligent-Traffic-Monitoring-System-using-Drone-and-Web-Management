"""
SENTINEL — Geometry Utilities
Spatial computations for violation detection.
"""
import math


def centroid_from_bbox(bbox: dict) -> tuple[float, float]:
    """Compute centroid from a bounding box dict with x1, y1, x2, y2."""
    cx = (bbox["x1"] + bbox["x2"]) / 2.0
    cy = (bbox["y1"] + bbox["y2"]) / 2.0
    return (cx, cy)


def point_side_of_line(
    point: tuple[float, float],
    line_start: tuple[float, float],
    line_end: tuple[float, float],
) -> float:
    """
    Determine which side of a line a point is on using cross product.
    Returns positive if point is on the left, negative if on the right.
    """
    return (
        (line_end[0] - line_start[0]) * (point[1] - line_start[1])
        - (line_end[1] - line_start[1]) * (point[0] - line_start[0])
    )


def line_crossing_detected(
    prev_pos: tuple[float, float],
    curr_pos: tuple[float, float],
    line_start: tuple[float, float],
    line_end: tuple[float, float],
) -> bool:
    """
    Check if movement from prev_pos to curr_pos crosses a line segment.
    Returns True if the two positions are on different sides of the line.
    """
    side_prev = point_side_of_line(prev_pos, line_start, line_end)
    side_curr = point_side_of_line(curr_pos, line_start, line_end)
    # Different signs = crossed the line
    return (side_prev * side_curr) < 0


def direction_vector(
    prev_pos: tuple[float, float],
    curr_pos: tuple[float, float],
) -> tuple[float, float]:
    """Compute the direction vector between two positions."""
    dx = curr_pos[0] - prev_pos[0]
    dy = curr_pos[1] - prev_pos[1]
    return (dx, dy)


def vector_magnitude(v: tuple[float, float]) -> float:
    """Compute the magnitude of a 2D vector."""
    return math.sqrt(v[0] ** 2 + v[1] ** 2)


def normalize_vector(v: tuple[float, float]) -> tuple[float, float]:
    """Normalize a 2D vector to unit length."""
    mag = vector_magnitude(v)
    if mag == 0:
        return (0.0, 0.0)
    return (v[0] / mag, v[1] / mag)


def dot_product(v1: tuple[float, float], v2: tuple[float, float]) -> float:
    """Compute the dot product of two 2D vectors."""
    return v1[0] * v2[0] + v1[1] * v2[1]
