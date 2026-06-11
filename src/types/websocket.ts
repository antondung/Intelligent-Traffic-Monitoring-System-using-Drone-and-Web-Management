/**
 * SENTINEL — WebSocket Type Definitions
 * TypeScript interfaces matching the backend WebSocket JSON schema.
 */

// ── WebSocket Message Types ──────────────────────────────

export interface WSBoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface WSPlateInfo {
  text: string | null;
  confidence: number;
}

export interface WSViolation {
  type: string | null;
  active: boolean;
  snapshot_url?: string;
  plate_url?: string;
}

export interface WSDetection {
  track_id: number;
  class: string;
  confidence: number;
  bbox: WSBoundingBox;
  plate: WSPlateInfo;
  violation: WSViolation;
}

export interface WSStatistics {
  total_vehicles: number;
  car: number;
  motorbike: number;
  truck: number;
  bus: number;
}

export interface WSAlert {
  id: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface WSOCRResult {
  track_id: number;
  text: string;
  confidence: number;
  vehicle_class: string;
}

// ── Message Payloads ─────────────────────────────────────

export interface FrameUpdateMessage {
  type: 'frame_update';
  timestamp: number;
  frame: string; // base64 JPEG
  detections: WSDetection[];
  statistics: WSStatistics;
  alerts: WSAlert[];
  ocr_results: WSOCRResult[];
  fps: number;
  processing_progress: number; // 0-100
  current_frame: number;
  total_frames: number;
}

export interface ProcessingStartedMessage {
  type: 'processing_started';
  session_id: string;
  message: string;
}

export interface ProcessingCompleteMessage {
  type: 'processing_complete';
  timestamp: number;
  statistics: WSStatistics;
  processing_duration: number;
  total_frames_processed: number;
  average_fps: number;
  message: string;
}

export interface ErrorMessage {
  type: 'error';
  timestamp?: number;
  message: string;
}

export type WSMessage =
  | FrameUpdateMessage
  | ProcessingStartedMessage
  | ProcessingCompleteMessage
  | ErrorMessage;

// ── Upload Response ──────────────────────────────────────

export interface UploadResponse {
  session_id: string;
  filename: string;
  size_bytes: number;
  video_path: string;
  message: string;
}

// ── Health Check Response ────────────────────────────────

export interface HealthResponse {
  status: string;
  models: {
    yolo_loaded: boolean;
    ocr_loaded: boolean;
  };
  gpu: {
    available: boolean;
    device: string | null;
  };
  websocket: {
    active_connections: number;
  };
}
