import { StateCreator } from 'zustand';

export interface WebsocketSlice {
  isConnected: boolean;
  isConnecting: boolean;
  backendOnline: boolean;
  setConnected: (connected: boolean) => void;
  setConnecting: (connecting: boolean) => void;
  setBackendOnline: (online: boolean) => void;
  resetWebsocket: () => void;
}

export const createWebsocketSlice: StateCreator<WebsocketSlice, [], [], WebsocketSlice> = (set) => ({
  isConnected: false,
  isConnecting: false,
  backendOnline: false,

  setConnected: (connected) => set({ isConnected: connected }),
  setConnecting: (connecting) => set({ isConnecting: connecting }),
  setBackendOnline: (online) => set({ backendOnline: online }),
  
  resetWebsocket: () => set({
    isConnected: false,
    isConnecting: false,
    backendOnline: false,
  }),
});
