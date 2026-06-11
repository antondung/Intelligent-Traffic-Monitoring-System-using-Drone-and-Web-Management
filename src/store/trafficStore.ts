/**
 * SENTINEL — Traffic Store Facade
 * Composes modular slices into a single unified Zustand store.
 * Acts as the SINGLE SOURCE OF TRUTH for all inference data.
 */

import { create } from 'zustand';
import { createUploadSlice, type UploadSlice } from './uploadStore';
import { createWebsocketSlice, type WebsocketSlice } from './websocketStore';
import { createTrackingSlice, type TrackingSlice } from './trackingStore';
import { createAnalyticsSlice, type AnalyticsSlice } from './analyticsStore';

export type { ViolationRecord, TimelinePoint } from './analyticsStore';

export interface TrafficState
  extends UploadSlice,
    WebsocketSlice,
    TrackingSlice,
    AnalyticsSlice {
  reset: () => void;
}

export const useTrafficStore = create<TrafficState>((set, get, store) => ({
  ...createUploadSlice(set, get, store as any),
  ...createWebsocketSlice(set, get, store as any),
  ...createTrackingSlice(set, get, store as any),
  ...createAnalyticsSlice(set, get, store as any),

  reset: () => {
    get().resetUpload();
    get().resetWebsocket();
    get().resetTracking();
    get().resetAnalytics();
  },
}));
