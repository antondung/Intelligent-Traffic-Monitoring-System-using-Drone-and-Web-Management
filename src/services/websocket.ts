/**
 * SENTINEL — WebSocket Service
 * Client-side WebSocket with auto-reconnect, message parsing, and event callbacks.
 */

import type { WSMessage, FrameUpdateMessage } from '../types/websocket';
import { getWebSocketUrl } from './api';

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface WebSocketCallbacks {
  onFrameUpdate?: (msg: FrameUpdateMessage) => void;
  onMessage?: (msg: WSMessage) => void;
  onStateChange?: (state: ConnectionState) => void;
  onError?: (error: string) => void;
}

export class TrafficWebSocket {
  private ws: WebSocket | null = null;
  private sessionId: string;
  private callbacks: WebSocketCallbacks;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private _state: ConnectionState = 'disconnected';
  private intentionalClose = false;

  constructor(sessionId: string, callbacks: WebSocketCallbacks) {
    this.sessionId = sessionId;
    this.callbacks = callbacks;
  }

  get state(): ConnectionState {
    return this._state;
  }

  private setState(state: ConnectionState): void {
    this._state = state;
    this.callbacks.onStateChange?.(state);
  }

  connect(): void {
    if (this.ws) {
      this.ws.close();
    }

    this.intentionalClose = false;
    this.setState('connecting');

    const url = getWebSocketUrl(this.sessionId);
    console.log(`[WS CONNECT URL] ${url}`);

    try {
      this.ws = new WebSocket(url);
    } catch (err) {
      console.error('[WS ERROR] Failed to create WebSocket:', err);
      this.setState('error');
      return;
    }

    this.ws.onopen = () => {
      console.log('[WS OPEN] Connected successfully');
      this.setState('connected');
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as WSMessage;
        this.callbacks.onMessage?.(msg);

        if (msg.type === 'frame_update') {
          console.log(`[FRAME RECEIVED] Received frame index: ${msg.current_frame}`);
          this.callbacks.onFrameUpdate?.(msg as FrameUpdateMessage);
        }
      } catch (err) {
        console.warn('[WS] Failed to parse message:', err);
      }
    };

    this.ws.onclose = (event) => {
      console.log(`[WS CLOSED] Connection closed: code=${event.code}, reason=${event.reason}`);
      this.ws = null;

      if (!this.intentionalClose && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.setState('connecting');
        this.scheduleReconnect();
      } else {
        this.setState('disconnected');
      }
    };

    this.ws.onerror = (event) => {
      console.error('[WS ERROR] WebSocket connection error:', event);
      this.callbacks.onError?.('WebSocket connection error');
    };
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    console.log(`[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  send(message: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(message);
    }
  }

  stop(): void {
    this.send('stop');
  }

  disconnect(): void {
    this.intentionalClose = true;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.setState('disconnected');
  }
}
