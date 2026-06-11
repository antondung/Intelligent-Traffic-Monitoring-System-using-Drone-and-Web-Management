import { useEffect, useRef, useState } from 'react';
import { useTrafficStore } from '../../store/trafficStore';
import type { FrameUpdateMessage } from '../../types/websocket';
import { Activity, Gauge, Layers, AlertTriangle } from 'lucide-react';

interface VideoCanvasProps {
  sessionId: string | null;
  isConnected: boolean;
  isProcessing: boolean;
  aiOverlay: boolean;
  fullscreenRef: React.RefObject<HTMLDivElement>;
}

export function VideoCanvas({
  sessionId,
  isConnected,
  isProcessing,
  aiOverlay,
  fullscreenRef,
}: VideoCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const queueRef = useRef<FrameUpdateMessage[]>([]);
  const renderLoopRef = useRef<number | null>(null);
  const isPlayingRef = useRef<boolean>(false);
  const isRenderingRef = useRef<boolean>(false);

  // Telemetry variables
  const wsFrameTimesRef = useRef<number[]>([]);
  const renderFrameTimesRef = useRef<number[]>([]);
  const lastBitrateTimeRef = useRef<number>(Date.now());
  const bytesReceivedRef = useRef<number>(0);
  const droppedCountRef = useRef<number>(0);
  const lastLatencyRef = useRef<number>(0);

  // Throttled UI Telemetry state (updates at 500ms)
  const [telemetry, setTelemetry] = useState({
    wsFps: 0,
    renderFps: 0,
    queueSize: 0,
    droppedFrames: 0,
    bitrate: 0, // Kbps
    latency: 0, // ms
  });

  // Main rendering loop using requestAnimationFrame
  const renderLoop = async () => {
    if (!isPlayingRef.current) return;

    if (isRenderingRef.current) {
      renderLoopRef.current = requestAnimationFrame(renderLoop);
      return;
    }

    const queue = queueRef.current;

    // Buffer threshold / frame-dropping to keep stream truly real-time
    const maxQueueSize = 5;
    if (queue.length > maxQueueSize) {
      const dropCount = queue.length - 2; // keep the latest 2 frames
      queue.splice(0, dropCount);
      droppedCountRef.current += dropCount;
      console.log(`[FRAME DROPPED] Dropped ${dropCount} frames | [QUEUE LENGTH] ${queue.length}`);
    }

    if (queue.length > 0) {
      const frame = queue[0];
      isRenderingRef.current = true;

      const img = new Image();
      img.src = `data:image/jpeg;base64,${frame.frame}`;

      try {
        // Offscreen async image decoding prevents browser layout thrashing/stutter
        await img.decode();

        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            // Match pixel coordinates natively to frame aspect ratio
            if (canvas.width !== img.naturalWidth || canvas.height !== img.naturalHeight) {
              canvas.width = img.naturalWidth;
              canvas.height = img.naturalHeight;
            }
            ctx.drawImage(img, 0, 0);
            console.log(`[FRAME DRAWN] Rendered frame index: ${frame.current_frame} | [QUEUE LENGTH] ${queue.length}`);
          }
        }

        // Successfully rendered -> remove from queue
        queue.shift();

        // Log render timestamp
        const now = performance.now();
        renderFrameTimesRef.current.push(now);

        // Save latest latency
        if (frame.latency) {
          lastLatencyRef.current = frame.latency;
        }

        // Synchronize Zustand traffic store HUD values with currently drawn frame
        useTrafficStore.setState({
          frame: frame.frame,
          detections: frame.detections,
          statistics: frame.statistics,
          fps: frame.fps,
          processingProgress: frame.processing_progress,
          currentFrame: frame.current_frame,
          totalFrames: frame.total_frames,
        });

      } catch (err) {
        console.warn('[CANVAS] Frame render load/decode failed:', err);
        queue.shift(); // Drop corrupted frame
      } finally {
        isRenderingRef.current = false;
      }
    }

    renderLoopRef.current = requestAnimationFrame(renderLoop);
  };

  // Telemetry updates (every 500ms for user readability)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = performance.now();
      const oneSecondAgo = now - 1000;

      // Filter timestamps
      wsFrameTimesRef.current = wsFrameTimesRef.current.filter((t) => t > oneSecondAgo);
      renderFrameTimesRef.current = renderFrameTimesRef.current.filter((t) => t > oneSecondAgo);

      const wsFps = wsFrameTimesRef.current.length;
      const renderFps = renderFrameTimesRef.current.length;

      // Compute Stream Bitrate
      const currentTime = Date.now();
      const timeDiffSec = (currentTime - lastBitrateTimeRef.current) / 1000;
      let bitrate = 0;
      if (timeDiffSec > 0) {
        bitrate = Math.round((bytesReceivedRef.current * 8) / 1000 / timeDiffSec);
      }
      bytesReceivedRef.current = 0;
      lastBitrateTimeRef.current = currentTime;

      setTelemetry({
        wsFps,
        renderFps,
        queueSize: queueRef.current.length,
        droppedFrames: droppedCountRef.current,
        bitrate,
        latency: lastLatencyRef.current,
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // Frame receiver hook registration
  useEffect(() => {
    isPlayingRef.current = true;
    renderLoopRef.current = requestAnimationFrame(renderLoop);

    // Register dynamic receiver callback in Zustand store
    useTrafficStore.setState({
      onFrameReceived: (msg: FrameUpdateMessage) => {
        console.log(`[WS FRAME RECEIVED] Received frame index: ${msg.current_frame}`);
        const now = performance.now();
        wsFrameTimesRef.current.push(now);
        // Estimate byte size of incoming packet base64
        bytesReceivedRef.current += msg.frame ? msg.frame.length * 0.75 : 0;
        queueRef.current.push(msg);
        console.log(`[QUEUE PUSH] Frame index: ${msg.current_frame} | [QUEUE LENGTH] ${queueRef.current.length}`);
      },
    });

    return () => {
      isPlayingRef.current = false;
      if (renderLoopRef.current) {
        cancelAnimationFrame(renderLoopRef.current);
      }
      // Clean up Zustand store callback
      useTrafficStore.setState({
        onFrameReceived: undefined,
      });
    };
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-slate-950">
      <canvas
        ref={canvasRef}
        className="w-full h-full object-contain select-none"
        style={{ imageRendering: 'auto' }}
      />

      {/* Cyberpunk HUD Telemetry Overlay */}
      {isProcessing && (
        <div className="absolute top-16 left-3 z-20 flex flex-wrap gap-2 pointer-events-none">
          {/* Net rate */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/60 backdrop-blur-md border border-white/[0.06] text-[9px] font-mono text-cyan-400">
            <Activity size={10} className="text-cyan-400" />
            <span className="text-slate-400">NET:</span>
            <span className="font-bold">{telemetry.bitrate} Kbps</span>
          </div>

          {/* Latency */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/60 backdrop-blur-md border border-white/[0.06] text-[9px] font-mono text-purple-400">
            <Gauge size={10} className="text-purple-400" />
            <span className="text-slate-400">AI LATENCY:</span>
            <span className="font-bold">{telemetry.latency} ms</span>
          </div>

          {/* Queue size */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/60 backdrop-blur-md border border-white/[0.06] text-[9px] font-mono text-emerald-400">
            <Layers size={10} className="text-emerald-400" />
            <span className="text-slate-400">QUEUE:</span>
            <span className="font-bold">{telemetry.queueSize}</span>
          </div>

          {/* Render FPS */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/60 backdrop-blur-md border border-white/[0.06] text-[9px] font-mono text-amber-400">
            <span className="text-slate-400">WS FPS / RENDER:</span>
            <span className="font-bold">{telemetry.wsFps} / {telemetry.renderFps}</span>
          </div>

          {/* Dropped Frames */}
          {telemetry.droppedFrames > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-500/15 backdrop-blur-md border border-red-500/20 text-[9px] font-mono text-red-400 animate-pulse">
              <AlertTriangle size={10} />
              <span>DROPPED:</span>
              <span className="font-bold">{telemetry.droppedFrames}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
