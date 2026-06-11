"""
SENTINEL — WebSocket Connection Manager
Manages active WebSocket connections by session.
"""
import logging
from typing import Any

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class WebSocketManager:
    """Manages active WebSocket connections by session for telemetry/health."""

    def __init__(self):
        self._connections: dict[str, WebSocket] = {}

    def register(self, session_id: str, websocket: WebSocket) -> None:
        """Register an active WebSocket connection."""
        self._connections[session_id] = websocket
        logger.info("WebSocket registered for session: %s", session_id)

    def unregister(self, session_id: str) -> None:
        """Unregister a WebSocket connection."""
        self._connections.pop(session_id, None)
        logger.info("WebSocket unregistered for session: %s", session_id)

    def is_connected(self, session_id: str) -> bool:
        return session_id in self._connections

    @property
    def active_connections(self) -> int:
        return len(self._connections)


# Global singleton
ws_manager = WebSocketManager()
