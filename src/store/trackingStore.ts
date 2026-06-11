import { StateCreator } from 'zustand';
import type { WSDetection } from '../types/websocket';

export interface TrackingSlice {
  frame: string | null;
  detections: WSDetection[];
  setFrame: (frame: string | null) => void;
  updateDetections: (detections: WSDetection[]) => void;
  resetTracking: () => void;
}

export const createTrackingSlice: StateCreator<TrackingSlice, [], [], TrackingSlice> = (set) => ({
  frame: null,
  detections: [],

  setFrame: (frame) => set({ frame }),
  updateDetections: (detections) => set({ detections }),
  
  resetTracking: () => set({
    frame: null,
    detections: [],
  }),
});
