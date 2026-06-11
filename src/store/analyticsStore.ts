import { StateCreator } from 'zustand';
import type { WSStatistics, WSAlert, WSOCRResult } from '../types/websocket';

export interface ViolationRecord {
  id: string;
  trackId: number;
  type: string;
  vehicleClass: string;
  plate: string | null;
  confidence: number;
  timestamp: number;
  snapshot?: string;
  plateUrl?: string;
}

export interface TimelinePoint {
  timestamp: number;
  label: string;
  totalVehicles: number;
  car: number;
  motorbike: number;
  truck: number;
  bus: number;
  fps: number;
  [key: string]: any; // Allow dynamic model classes
}

export interface AnalyticsSlice {
  statistics: WSStatistics;
  alerts: WSAlert[];
  violations: ViolationRecord[];
  ocrResults: WSOCRResult[];
  fps: number;
  processingProgress: number; // 0-100
  currentFrame: number;
  totalFrames: number;
  timelineData: TimelinePoint[];
  isProcessing: boolean;
  processingComplete: boolean;
  processingDuration: number;
  averageFps: number;

  updateStatistics: (stats: WSStatistics) => void;
  addAlerts: (alerts: WSAlert[]) => void;
  addViolation: (violation: ViolationRecord) => void;
  addOCRResults: (results: WSOCRResult[]) => void;
  updateMetrics: (fps: number, progress: number, currentFrame: number, totalFrames: number) => void;
  addTimelinePoint: (point: TimelinePoint) => void;
  setProcessing: (processing: boolean) => void;
  setProcessingComplete: (complete: boolean, duration?: number, avgFps?: number) => void;
  resetAnalytics: () => void;
}

const initialStatistics: WSStatistics = {
  total_vehicles: 0,
  car: 0,
  motorbike: 0,
  truck: 0,
  bus: 0,
};

export const createAnalyticsSlice: StateCreator<AnalyticsSlice, [], [], AnalyticsSlice> = (set) => ({
  statistics: { ...initialStatistics },
  alerts: [],
  violations: [],
  ocrResults: [],
  fps: 0,
  processingProgress: 0,
  currentFrame: 0,
  totalFrames: 0,
  timelineData: [],
  isProcessing: false,
  processingComplete: false,
  processingDuration: 0,
  averageFps: 0,

  updateStatistics: (stats) => set({ statistics: stats }),

  addAlerts: (alerts) =>
    set((state) => ({
      alerts: [...alerts, ...state.alerts].slice(0, 50),
    })),

  addViolation: (violation) =>
    set((state) => ({
      violations: [violation, ...state.violations].slice(0, 200),
    })),

  addOCRResults: (results) =>
    set((state) => {
      const existing = new Map(state.ocrResults.map((r) => [r.track_id, r]));
      for (const r of results) {
        existing.set(r.track_id, r);
      }
      return { ocrResults: Array.from(existing.values()) };
    }),

  updateMetrics: (fps, progress, currentFrame, totalFrames) =>
    set({ fps, processingProgress: progress, currentFrame, totalFrames }),

  addTimelinePoint: (point) =>
    set((state) => ({
      timelineData: [...state.timelineData, point].slice(-120),
    })),

  setProcessing: (processing) => set({ isProcessing: processing }),

  setProcessingComplete: (complete, duration, avgFps) =>
    set({
      processingComplete: complete,
      isProcessing: !complete,
      processingDuration: duration ?? 0,
      averageFps: avgFps ?? 0,
    }),

  resetAnalytics: () =>
    set({
      statistics: { ...initialStatistics },
      alerts: [],
      violations: [],
      ocrResults: [],
      fps: 0,
      processingProgress: 0,
      currentFrame: 0,
      totalFrames: 0,
      timelineData: [],
      isProcessing: false,
      processingComplete: false,
      processingDuration: 0,
      averageFps: 0,
    }),
});
