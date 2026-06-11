// ══════════════════════════════════════════════════════
// SENTINEL — Live Monitoring Page
// AI-Powered Real-Time Drone Surveillance HUD
// ══════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import vi from '../i18n/vi';
import { motion } from 'framer-motion';
import {
  Video,
  Maximize2,
  Eye,
  EyeOff,
  Camera,
  Circle,
  Satellite,
  Gauge,
  AlertTriangle,
  Car,
  Bike,
  Truck,
  Bus,
  User,
  Crosshair,
  Radio,
  Activity,
  Wifi,
  WifiOff,
  StopCircle,
} from 'lucide-react';
import type { VehicleDetection } from '../types';
import { VEHICLE_COLORS } from '../types';
import { useTrafficStore } from '../store/trafficStore';
import { useWebSocket } from '../hooks/useWebSocket';
import { VideoUploader } from '../components/upload/VideoUploader';
import { EmptyState } from '../components/shared/EmptyState';
import { ProcessingOverlay } from '../components/shared/ProcessingOverlay';
import { VideoCanvas } from '../components/monitor/VideoCanvas';

// ── Bounding Box Component ─────────────────────────



// ── HUD Corner Brackets ────────────────────────────

function HUDCorners() {
  const cornerLen = 30;
  const offset = 8;
  const color = 'rgba(0,212,255,0.5)';

  return (
    <>
      {/* TL */}
      <div className="absolute" style={{ top: offset, left: offset, width: cornerLen, height: cornerLen, borderTop: `2px solid ${color}`, borderLeft: `2px solid ${color}` }} />
      {/* TR */}
      <div className="absolute" style={{ top: offset, right: offset, width: cornerLen, height: cornerLen, borderTop: `2px solid ${color}`, borderRight: `2px solid ${color}` }} />
      {/* BL */}
      <div className="absolute" style={{ bottom: offset, left: offset, width: cornerLen, height: cornerLen, borderBottom: `2px solid ${color}`, borderLeft: `2px solid ${color}` }} />
      {/* BR */}
      <div className="absolute" style={{ bottom: offset, right: offset, width: cornerLen, height: cornerLen, borderBottom: `2px solid ${color}`, borderRight: `2px solid ${color}` }} />
    </>
  );
}

// ── Scan Line ──────────────────────────────────────

function ScanLine() {
  return (
    <motion.div
      className="absolute left-0 right-0 h-[2px] pointer-events-none z-10"
      style={{
        background: 'linear-gradient(to right, transparent, rgba(0,212,255,0.15) 20%, rgba(0,212,255,0.25) 50%, rgba(0,212,255,0.15) 80%, transparent)',
        boxShadow: '0 0 15px rgba(0,212,255,0.12)',
      }}
      animate={{ top: ['0%', '100%'] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
    />
  );
}

// ── Grid Overlay ───────────────────────────────────

function GridOverlay() {
  return (
    <div
      className="absolute inset-0 pointer-events-none opacity-[0.04]"
      style={{
        backgroundImage: `
          linear-gradient(rgba(0,212,255,0.4) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,212,255,0.4) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      }}
    />
  );
}



// ── Vehicle Type Icon ──────────────────────────────

function VehicleIcon({ type, size = 14 }: { type: string; size?: number }) {
  const color = VEHICLE_COLORS[type as keyof typeof VEHICLE_COLORS] || '#00D4FF';
  const props = { size, color, strokeWidth: 1.5 };
  switch (type) {
    case 'car': return <Car {...props} />;
    case 'motorbike': return <Bike {...props} />;
    case 'bicycle': return <Bike {...props} />;
    case 'truck': return <Truck {...props} />;
    case 'bus': return <Bus {...props} />;
    case 'person': return <User {...props} />;
    default: return <Car {...props} />;
  }
}

// ── Detection Feed Item ────────────────────────────

interface DetectionItemProps {
  detection: VehicleDetection;
  index: number;
}

function DetectionItem({ detection, index }: DetectionItemProps) {
  const color = VEHICLE_COLORS[detection.type] || '#00D4FF';
  const now = new Date();
  const seconds = (detection.trackId % 30) + 1;
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(Math.max(0, now.getSeconds() - seconds)).padStart(2, '0')}`;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.1] transition-colors"
    >
      <div
        className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}
      >
        <VehicleIcon type={detection.type} size={12} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-mono font-medium text-white capitalize">{{ car: vi.common.car, motorbike: vi.common.motorbike, truck: vi.common.truck, bus: vi.common.bus, person: vi.common.person, bicycle: vi.common.bicycle }[detection.type] || detection.type}</span>
          <span className="text-[9px] font-mono" style={{ color }}>{detection.confidence.toFixed(2)}</span>
        </div>
        <div className="text-[9px] font-mono text-slate-500">
          ID:{detection.trackId} · {detection.speed.toFixed(0)}km/h
        </div>
      </div>
      <span className="text-[9px] font-mono text-slate-600 flex-shrink-0">{timeStr}</span>
    </motion.div>
  );
}

// ── Alert Item ─────────────────────────────────────

interface AlertInfo {
  id: number;
  type: 'critical' | 'warning' | 'info';
  message: string;
}

// ══════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ══════════════════════════════════════════════════════

export default function LiveMonitoring() {
  // ── State ──────────────────────────────────────────
  const [aiOverlay, setAiOverlay] = useState(true);
  const [timestamp, setTimestamp] = useState('');
  const feedRef = useRef<HTMLDivElement>(null);
  const detectionFeedRef = useRef<HTMLDivElement>(null);

  // ── Real-time AI Store — SINGLE SOURCE OF TRUTH ──
  const {
    frame: aiFrame,
    detections: aiDetections,
    statistics: aiStats,
    alerts: aiAlerts,
    fps: aiFps,
    isConnected,
    isProcessing,
    processingComplete,
    sessionId,
  } = useTrafficStore();

  console.log("[RENDER] Detections count: " + aiDetections.length);

  // Connect WebSocket when session is available
  const { disconnect, send } = useWebSocket(sessionId);

  // Synchronize overlay state dynamically with backend
  useEffect(() => {
    if (sessionId && isConnected) {
      send(aiOverlay ? 'enable_overlay' : 'disable_overlay');
    }
  }, [aiOverlay, isConnected, sessionId, send]);

  // Determine if we have an active AI session
  const hasActiveSession = sessionId !== null && (isProcessing || processingComplete);

  // Alert bar data — ONLY real alerts from AI
  const alerts = useMemo<AlertInfo[]>(() => {
    if (aiAlerts.length > 0) {
      return aiAlerts.map((a, i) => ({
        id: i + 1,
        type: (a.severity === 'critical' ? 'critical' : a.severity === 'high' ? 'warning' : 'info') as AlertInfo['type'],
        message: a.message,
      }));
    }
    return [];
  }, [aiAlerts]);

  // ── Timestamp updater ──────────────────────────────
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimestamp(
        `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ` +
        `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll detection feed
  useEffect(() => {
    if (detectionFeedRef.current) {
      detectionFeedRef.current.scrollTop = 0;
    }
  }, [aiDetections]);

  // ── Fullscreen ─────────────────────────────────────
  const handleFullscreen = useCallback(() => {
    if (feedRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        feedRef.current.requestFullscreen();
      }
    }
  }, []);

  // ── Render ─────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen p-4 lg:p-5 space-y-4"
    >
      {/* ════════ PAGE HEADER ════════ */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <Video size={22} className="text-cyan-400" />
            <motion.div
              className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500"
              animate={{ opacity: [1, 0.3, 1], scale: [1, 0.8, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              style={{ boxShadow: '0 0 6px rgba(239,68,68,0.6)' }}
            />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              {vi.monitoring.title}
              <motion.span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500/15 text-red-400 border border-red-500/20"
                animate={{ opacity: [1, 0.6, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                LIVE
              </motion.span>
            </h1>
            <p className="text-xs text-slate-500 font-mono">{vi.monitoring.subtitle}</p>
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-3">
          {/* FPS */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <Activity size={12} className="text-emerald-400" />
            <span className="text-[10px] font-mono text-slate-400">FPS</span>
            <span className="text-xs font-mono font-bold text-emerald-400">{aiFps.toFixed(1)}</span>
          </div>

          {/* GPS */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <Satellite size={12} className="text-purple-400" />
            <span className="text-[10px] font-mono text-slate-400">
              {aiStats.total_vehicles} phương tiện
            </span>
          </div>

          {/* AI Toggle */}
          <button
            onClick={() => setAiOverlay(prev => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
              aiOverlay
                ? 'bg-cyan-400/10 text-cyan-400 border border-cyan-400/30 shadow-[0_0_10px_rgba(0,212,255,0.1)]'
                : 'bg-white/[0.03] text-slate-500 border border-white/[0.06]'
            }`}
          >
            {aiOverlay ? <Eye size={13} /> : <EyeOff size={13} />}
            {vi.monitoring.aiOverlay}
          </button>
        </div>
      </motion.div>

      {/* ════════ MAIN CONTENT ════════ */}
      <div className="flex flex-col xl:flex-row gap-4">

        {/* ──── LEFT: Main Feed ──────────────────────── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex-1 space-y-3 min-w-0"
        >
          {/* Video Feed */}
          <div
            ref={feedRef}
            className="relative aspect-video bg-slate-900 rounded-2xl overflow-hidden border border-white/[0.06] shadow-[0_0_30px_rgba(0,0,0,0.5)]"
          >
            {/* Background gradient — shown when no active session */}
            {!hasActiveSession && <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900" />}

            {/* ── AI Processed Canvas (Smoothed Realtime Video Stream) ── */}
            {hasActiveSession && (
              <VideoCanvas
                sessionId={sessionId}
                isConnected={isConnected}
                isProcessing={isProcessing}
                aiOverlay={aiOverlay}
                fullscreenRef={feedRef}
              />
            )}

            {/* ── Video Uploader (shown when no active session) ── */}
            {!hasActiveSession && (
              <div className="absolute inset-0 z-30">
                <VideoUploader />
              </div>
            )}

            {/* Grid overlay — only when no active session */}
            {!hasActiveSession && <GridOverlay />}

            {/* HUD corners — always visible */}
            <HUDCorners />

            {/* Scan line — only when processing */}
            {isProcessing && <ScanLine />}

            {/* Subtle noise texture */}
            <div className="absolute inset-0 opacity-[0.015] pointer-events-none" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E")`,
            }} />

            {/* ── Top-right: Connection Status ── */}
            <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
              {/* WebSocket connection indicator */}
              {sessionId && (
                <div className={`flex items-center gap-1 px-2 py-1 rounded text-[9px] font-mono font-bold ${
                  isConnected
                    ? 'bg-emerald-400/10 border border-emerald-400/20 text-emerald-400'
                    : 'bg-amber-400/10 border border-amber-400/20 text-amber-400'
                }`}>
                  {isConnected ? <Wifi size={10} /> : <WifiOff size={10} />}
                  {isConnected ? 'CONNECTED' : 'RECONNECTING'}
                </div>
              )}
              <motion.div
                className="flex items-center gap-1.5 px-2 py-1 rounded bg-red-500/15 border border-red-500/25"
                animate={{ opacity: isProcessing ? [1, 0.5, 1] : 1 }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <motion.div
                  className="w-2 h-2 rounded-full bg-red-500"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  style={{ boxShadow: '0 0 6px rgba(239,68,68,0.5)' }}
                />
                <span className="text-[10px] font-mono font-bold text-red-400 tracking-wider">
                  {isProcessing ? 'AI PROCESSING' : vi.monitoring.rec}
                </span>
              </motion.div>
              <span className="text-[10px] font-mono text-slate-400 bg-black/30 px-1.5 py-0.5 rounded">{timestamp}</span>
            </div>

            {/* ── Bottom-left: Stats / Session info ── */}
            <div className="absolute bottom-3 left-3 z-20">
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-black/50 backdrop-blur-sm border border-white/[0.08]">
                <Crosshair size={11} className="text-cyan-400" />
                <span className="text-[10px] font-mono text-cyan-400/80 tracking-wide">
                  {hasActiveSession
                    ? `VEHICLES: ${aiStats.total_vehicles} | 🚗${aiStats.car} 🏍${aiStats.motorbike} 🚛${aiStats.truck} 🚌${aiStats.bus}`
                    : `SẴN SÀNG | VUI LÒNG TẢI VIDEO LÊN`
                  }
                </span>
              </div>
            </div>

            {/* ── Bottom-right: AI info ── */}
            <div className="absolute bottom-3 right-3 z-20">
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-black/50 backdrop-blur-sm border border-white/[0.08]">
                <span className="text-[10px] font-mono text-slate-400 tracking-wide">
                  {hasActiveSession
                    ? <>DETECTIONS: <span className="text-cyan-400">{aiDetections.length}</span> | AI: <span className="text-purple-400">YOLOv8</span> | OCR: <span className="text-amber-400">EasyOCR</span></>
                    : <>HỆ THỐNG: <span className="text-emerald-400">ONLINE</span> | AI: <span className="text-purple-400">YOLOv8</span> | TRACKING: <span className="text-cyan-400">ByteTrack</span></>
                  }
                </span>
              </div>
            </div>

            {/* ── Top-left: Session label ── */}
            <div className="absolute top-3 left-3 z-20">
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-black/50 backdrop-blur-sm border border-white/[0.08]">
                <Radio size={11} className="text-cyan-400" />
                <span className="text-[10px] font-mono text-white/70 tracking-wide">
                  {hasActiveSession ? `SESSION: ${sessionId?.slice(0, 8)}` : 'HỆ THỐNG GIÁM SÁT AI'}
                </span>
                <div className={`w-1.5 h-1.5 rounded-full ${isProcessing ? 'bg-red-400 animate-pulse' : 'bg-emerald-400'}`} style={{ boxShadow: isProcessing ? '0 0 4px #F87171' : '0 0 4px #22C55E' }} />
              </div>
            </div>

            {/* ── Processing Complete Overlay ── */}
            {processingComplete && (
              <div className="absolute inset-0 flex items-center justify-center z-25 pointer-events-none">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="px-6 py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 backdrop-blur-sm"
                >
                  <span className="text-sm font-mono font-bold text-emerald-400">✓ Xử lý hoàn tất — {aiStats.total_vehicles} phương tiện phát hiện</span>
                </motion.div>
              </div>
            )}

            {/* ── Center crosshair ── */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="relative w-10 h-10 opacity-20">
                <div className="absolute left-1/2 top-0 w-[1px] h-full bg-cyan-400 -translate-x-1/2" />
                <div className="absolute top-1/2 left-0 h-[1px] w-full bg-cyan-400 -translate-y-1/2" />
                <div className="absolute inset-2 rounded-full border border-cyan-400/30" />
              </div>
            </div>
          </div>

          {/* ── Feed Toolbar ─────────────────────────── */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleFullscreen}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:border-cyan-400/30 text-xs font-mono text-slate-400 hover:text-cyan-400 transition-all cursor-pointer"
            >
              <Maximize2 size={13} />
              {vi.monitoring.fullscreen}
            </button>
            <button
              onClick={() => setAiOverlay(prev => !prev)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                aiOverlay
                  ? 'bg-cyan-400/10 text-cyan-400 border border-cyan-400/30'
                  : 'bg-white/[0.03] text-slate-400 border border-white/[0.06] hover:border-white/[0.1]'
              }`}
            >
              {aiOverlay ? <Eye size={13} /> : <EyeOff size={13} />}
              {vi.monitoring.aiOverlay}
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:border-purple-400/30 text-xs font-mono text-slate-400 hover:text-purple-400 transition-all cursor-pointer">
              <Camera size={13} />
              {vi.monitoring.snapshot}
            </button>
            {/* Stop processing button — only when AI is active */}
            {isProcessing && (
              <button
                onClick={disconnect}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 text-xs font-mono transition-all cursor-pointer hover:bg-red-500/20"
              >
                <StopCircle size={13} />
                Dừng xử lý
              </button>
            )}
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:border-red-400/30 text-xs font-mono text-slate-400 hover:text-red-400 transition-all cursor-pointer">
              <Circle size={13} className="text-red-500" />
              {vi.monitoring.record}
            </button>

          </div>
        </motion.div>

        {/* ──── RIGHT PANEL ──────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full xl:w-[340px] 2xl:w-[380px] space-y-4 flex-shrink-0"
        >

          {/* ── 3A: AI Processing Stats ───────────────── */}
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gauge size={14} className="text-cyan-400" />
                <span className="text-xs font-mono font-bold text-white tracking-wider uppercase">Thống kê AI</span>
              </div>
              <span className="text-[9px] font-mono text-slate-500">{isProcessing ? 'Đang xử lý' : hasActiveSession ? 'Hoàn tất' : 'Chờ video'}</span>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <Car size={12} className="text-cyan-400" />
                <div>
                  <div className="text-[9px] font-mono text-slate-500 uppercase">{vi.common.car}</div>
                  <span className="text-[11px] font-mono font-bold text-white">{aiStats.car}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <Bike size={12} className="text-purple-400" />
                <div>
                  <div className="text-[9px] font-mono text-slate-500 uppercase">{vi.common.motorbike}</div>
                  <span className="text-[11px] font-mono font-bold text-white">{aiStats.motorbike}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <Truck size={12} className="text-amber-400" />
                <div>
                  <div className="text-[9px] font-mono text-slate-500 uppercase">{vi.common.truck}</div>
                  <span className="text-[11px] font-mono font-bold text-white">{aiStats.truck}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <Bus size={12} className="text-emerald-400" />
                <div>
                  <div className="text-[9px] font-mono text-slate-500 uppercase">{vi.common.bus}</div>
                  <span className="text-[11px] font-mono font-bold text-white">{aiStats.bus}</span>
                </div>
              </div>
            </div>

            {/* Total */}
            <div className="px-3 py-2 rounded-lg bg-cyan-400/[0.04] border border-cyan-400/10">
              <div className="text-[9px] font-mono text-cyan-400/60 uppercase mb-0.5">Tổng phương tiện</div>
              <div className="text-lg font-mono font-bold text-cyan-400">{aiStats.total_vehicles}</div>
            </div>
          </div>

          {/* ── 3B: Detection Feed ────────────────────── */}
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crosshair size={14} className="text-purple-400" />
                <span className="text-xs font-mono font-bold text-white tracking-wider uppercase">{vi.monitoring.detectionFeed}</span>
              </div>
              {aiDetections.length > 0 && (
                <motion.div
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-400/10 border border-emerald-400/20"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[8px] font-mono text-emerald-400 font-bold">LIVE</span>
                </motion.div>
              )}
            </div>

            <div
              ref={detectionFeedRef}
              className="space-y-1.5 max-h-[260px] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/5 pr-1"
            >
              {aiDetections.length > 0
                ? aiDetections.map((d, i) => {
                    const mapped: VehicleDetection = {
                      id: d.track_id,
                      type: d.class as VehicleDetection['type'],
                      confidence: d.confidence,
                      bbox: { x: d.bbox.x1, y: d.bbox.y1, w: d.bbox.x2 - d.bbox.x1, h: d.bbox.y2 - d.bbox.y1 },
                      speed: 0,
                      color: VEHICLE_COLORS[d.class as VehicleDetection['type']] || '#00D4FF',
                      trackId: d.track_id,
                      licensePlate: d.plate?.text || undefined,
                    };
                    return <DetectionItem key={`ai-${d.track_id}-${i}`} detection={mapped} index={i} />;
                  })
                : (
                  <EmptyState
                    icon={<Crosshair className="w-5 h-5" />}
                    title="Chưa có nhận diện"
                    description="Tải lên video để bắt đầu nhận diện AI"
                    compact
                  />
                )
              }
            </div>
          </div>

          {/* ── 3C: Processing Info ──────────────────── */}
          <ProcessingOverlay />

        </motion.div>
      </div>

      {/* ════════ ALERT BAR ════════ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="relative overflow-hidden bg-white/[0.02] backdrop-blur-xl border border-white/[0.06] rounded-xl"
      >
        {/* Left gradient fade */}
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-slate-950 to-transparent z-10 pointer-events-none" />
        {/* Right gradient fade */}
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-slate-950 to-transparent z-10 pointer-events-none" />

        <div className="flex items-center gap-2 px-3 py-2.5">
          {/* Alert icon */}
          <div className="flex items-center gap-1.5 pr-3 border-r border-white/[0.06] flex-shrink-0 z-20">
            <motion.div
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <AlertTriangle size={14} className="text-amber-400" />
            </motion.div>
            <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">Cảnh báo</span>
          </div>

          {/* Scrolling alerts */}
          <div className="overflow-hidden flex-1">
            <motion.div
              className="flex gap-8 whitespace-nowrap"
              animate={{ x: ['0%', '-50%'] }}
              transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
            >
              {[...alerts, ...alerts].map((alert, i) => (
                <div key={`${alert.id}-${i}`} className="flex items-center gap-2 flex-shrink-0">
                  <div
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: alert.type === 'critical' ? '#EF4444' : alert.type === 'warning' ? '#F59E0B' : '#00D4FF',
                      boxShadow: alert.type === 'critical'
                        ? '0 0 6px rgba(239,68,68,0.4)'
                        : alert.type === 'warning'
                        ? '0 0 6px rgba(245,158,11,0.4)'
                        : '0 0 6px rgba(0,212,255,0.4)',
                    }}
                  />
                  <span
                    className="text-[10px] font-mono"
                    style={{
                      color: alert.type === 'critical' ? '#FCA5A5' : alert.type === 'warning' ? '#FDE68A' : '#94A3B8',
                    }}
                  >
                    {alert.message}
                  </span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
