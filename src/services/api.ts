/**
 * SENTINEL — API Service
 * REST API abstraction layer for backend communication.
 */

import type { UploadResponse, HealthResponse } from '../types/websocket';

// Backend URL — configurable via env variable, defaults to same-origin (proxied by Vite)
const API_BASE = import.meta.env.VITE_API_URL || '';

/**
 * Upload a video file to the backend for AI processing.
 * Returns a session_id to use for WebSocket connection.
 */
export async function uploadVideo(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  // Use XMLHttpRequest for progress tracking
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress(percent);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve(data as UploadResponse);
        } catch {
          reject(new Error('Invalid response from server'));
        }
      } else {
        try {
          const error = JSON.parse(xhr.responseText);
          reject(new Error(error.detail || `Upload failed: ${xhr.status}`));
        } catch {
          reject(new Error(`Upload failed: ${xhr.status}`));
        }
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Network error — is the backend running?'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload cancelled'));
    });

    xhr.open('POST', `${API_BASE}/api/upload`);
    xhr.send(formData);
  });
}

/**
 * Check backend health status.
 */
export async function checkHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_BASE}/api/health`);
  if (!res.ok) {
    throw new Error(`Health check failed: ${res.status}`);
  }
  return res.json();
}

/**
 * Get the WebSocket URL for a processing session.
 */
export function getWebSocketUrl(sessionId: string): string {
  // Determine WebSocket protocol based on current page protocol
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

  if (API_BASE) {
    // If explicit API URL is set, convert to WebSocket URL
    const wsUrl = API_BASE.replace(/^http/, 'ws');
    return `${wsUrl}/ws/live/${sessionId}`;
  }

  // If host is on localhost:3000, connect directly to port 8000 to avoid Vite proxy 1006 aborts
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return `ws://127.0.0.1:8000/ws/live/${sessionId}`;
  }

  // Default: same host, proxied by Vite
  return `${protocol}//${window.location.host}/ws/live/${sessionId}`;
}
