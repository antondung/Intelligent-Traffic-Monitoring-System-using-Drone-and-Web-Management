/**
 * SENTINEL — useWebSocket Hook
 * React hook wrapping the WebSocket service for real-time AI data streaming.
 * Dispatches ALL inference data to the Zustand traffic store.
 */

import { useEffect, useRef, useCallback } from 'react';
import { TrafficWebSocket } from '../services/websocket';
import { useTrafficStore, type ViolationRecord, type TimelinePoint } from '../store/trafficStore';
import type { WSMessage, FrameUpdateMessage } from '../types/websocket';

export function useWebSocket(sessionId: string | null) {
  const wsRef = useRef<TrafficWebSocket | null>(null);

  const {
    setFrame,
    updateDetections,
    updateStatistics,
    addAlerts,
    addViolation,
    addOCRResults,
    updateMetrics,
    addTimelinePoint,
    setConnected,
    setProcessing,
    setProcessingComplete,
  } = useTrafficStore();

  // Throttle timeline accumulation — add a point every ~2 seconds
  const lastTimelineRef = useRef<number>(0);

  const handleFrameUpdate = useCallback(
    (msg: FrameUpdateMessage) => {
      console.log("[WS MESSAGE]", msg);
      console.log("[FRAME RECEIVED]", msg.frame ? "YES" : "NO");
      console.log("[DETECTIONS RECEIVED]", msg.detections);

      // Check if canvas receiver is registered
      const onFrameReceived = (useTrafficStore.getState() as any).onFrameReceived;
      if (onFrameReceived) {
        onFrameReceived(msg);
      } else {
        // Core data
        setFrame(msg.frame);
        updateDetections(msg.detections);
        updateStatistics(msg.statistics);

        // Real-time metrics
        updateMetrics(
          msg.fps ?? 0,
          msg.processing_progress ?? 0,
          msg.current_frame ?? 0,
          msg.total_frames ?? 0,
        );
      }

      // Alerts
      if (msg.alerts.length > 0) {
        addAlerts(msg.alerts);
      }

      // OCR results
      if (msg.ocr_results && msg.ocr_results.length > 0) {
        addOCRResults(msg.ocr_results);
      }

      // Extract violations from detections and add to log
      for (const det of msg.detections) {
        if (det.violation?.active && det.violation.type) {
          const record: ViolationRecord = {
            id: `v_${Date.now()}_${det.track_id}`,
            trackId: det.track_id,
            type: det.violation.type,
            vehicleClass: det.class,
            plate: det.plate?.text || null,
            confidence: det.confidence,
            timestamp: msg.timestamp,
            snapshot: det.violation.snapshot_url || '',
            plateUrl: det.violation.plate_url || '',
          };
          addViolation(record);
        }
      }

      // Accumulate timeline data point (throttled to every ~2 seconds)
      const now = Date.now();
      if (now - lastTimelineRef.current > 2000) {
        lastTimelineRef.current = now;
        const timeLabel = new Date(msg.timestamp * 1000).toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
        const point: TimelinePoint = {
          timestamp: msg.timestamp,
          label: timeLabel,
          totalVehicles: msg.statistics.total_vehicles,
          car: msg.statistics.car,
          motorbike: msg.statistics.motorbike,
          truck: msg.statistics.truck,
          bus: msg.statistics.bus,
          fps: msg.fps ?? 0,
        };
        addTimelinePoint(point);
      }
    },
    [setFrame, updateDetections, updateStatistics, addAlerts, addViolation, addOCRResults, updateMetrics, addTimelinePoint],
  );

  const handleMessage = useCallback(
    (msg: WSMessage) => {
      console.log("[WS MESSAGE]", msg);
      switch (msg.type) {
        case 'processing_started':
          setProcessing(true);
          setProcessingComplete(false);
          break;
        case 'processing_complete':
          setProcessingComplete(
            true,
            msg.processing_duration,
            msg.average_fps,
          );
          if (msg.statistics) {
            updateStatistics(msg.statistics);
          }
          break;
        case 'error':
          console.error('[WS] Backend error:', msg.message);
          break;
      }
    },
    [setProcessing, setProcessingComplete, updateStatistics],
  );

  const handleStateChange = useCallback(
    (state: string) => {
      setConnected(state === 'connected');
    },
    [setConnected],
  );

  // Connect when sessionId changes
  useEffect(() => {
    if (!sessionId) return;

    // Create WebSocket instance
    const ws = new TrafficWebSocket(sessionId, {
      onFrameUpdate: handleFrameUpdate,
      onMessage: handleMessage,
      onStateChange: handleStateChange,
    });

    wsRef.current = ws;
    ws.connect();

    return () => {
      ws.disconnect();
      wsRef.current = null;
    };
  }, [sessionId, handleFrameUpdate, handleMessage, handleStateChange]);

  const send = useCallback((message: string) => {
    wsRef.current?.send(message);
  }, []);

  const disconnect = useCallback(() => {
    wsRef.current?.disconnect();
  }, []);

  const stop = useCallback(() => {
    wsRef.current?.stop();
  }, []);

  return { disconnect, stop, send };
}
