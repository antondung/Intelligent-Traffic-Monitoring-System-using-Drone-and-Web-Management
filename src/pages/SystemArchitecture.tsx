import { useState, useEffect, useMemo } from 'react';
import vi from '../i18n/vi';
import { motion } from 'framer-motion';
import { useTrafficStore } from '../store/trafficStore';
import {
  Network,
  Plane,
  Video,
  ScanEye,
  Route,
  Type,
  Database,
  Monitor,
  Cpu,
  Globe,
  Container,
  Gauge,
  Clock,
  Activity,
  MemoryStick,
  Zap,
  Server,
  Layers,
} from 'lucide-react';
import {
  LineChart,
  Line,
  ResponsiveContainer,
  YAxis,
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PipelineNode {
  id: string;
  icon: React.ElementType;
  label: string;
  tech: string;
  metric: string;
  metricLabel: string;
}

interface InfraCard {
  id: string;
  category: string;
  color: string;
  borderColor: string;
  bgGlow: string;
  icon: React.ElementType;
  technologies: string[];
  metric: string;
  metricLabel: string;
}

interface PerfMetric {
  id: string;
  label: string;
  value: number;
  unit: string;
  icon: React.ElementType;
  color: string;
  max?: number;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const pipelineNodes: PipelineNode[] = [
  { id: 'drone', icon: Plane, label: vi.architecture.droneFleet, tech: 'DJI Mavic 3T', metric: '24', metricLabel: vi.header.online },
  { id: 'stream', icon: Video, label: vi.architecture.videoStream, tech: 'RTSP/WebRTC', metric: '30 FPS', metricLabel: 'Framerate' },
  { id: 'yolo', icon: ScanEye, label: 'Nhận diện YOLOv8', tech: 'v8.2 CUDA', metric: '94.8%', metricLabel: 'Chính xác' },
  { id: 'track', icon: Route, label: 'ByteTrack', tech: 'Multi-Object', metric: '342', metricLabel: 'Theo dõi' },
  { id: 'ocr', icon: Type, label: 'EasyOCR', tech: 'Vietnamese', metric: '91.2%', metricLabel: 'Biển số' },
  { id: 'db', icon: Database, label: 'PostgreSQL', tech: 'PostgreSQL 16', metric: '2.1ms', metricLabel: 'Ghi dữ liệu' },
  { id: 'dash', icon: Monitor, label: vi.architecture.dashboard, tech: 'React + Vite', metric: '12ms', metricLabel: 'Độ trễ' },
];

const infraCards: InfraCard[] = [
  {
    id: 'frontend',
    category: vi.architecture.frontend,
    color: 'text-cyan-400',
    borderColor: 'border-cyan-400/20',
    bgGlow: 'shadow-[0_0_30px_rgba(0,212,255,0.06)]',
    icon: Monitor,
    technologies: ['React 18', 'Vite 5', 'TypeScript 5.3', 'TailwindCSS v4', 'Framer Motion'],
    metric: '< 1.2s',
    metricLabel: 'FCP',
  },
  {
    id: 'backend',
    category: vi.architecture.backend,
    color: 'text-purple-400',
    borderColor: 'border-purple-400/20',
    bgGlow: 'shadow-[0_0_30px_rgba(168,85,247,0.06)]',
    icon: Server,
    technologies: ['FastAPI 0.109', 'WebSocket', 'REST API', 'Celery', 'Redis Queue'],
    metric: '8ms',
    metricLabel: 'Phản hồi TB',
  },
  {
    id: 'ai',
    category: vi.architecture.aiEngineLabel,
    color: 'text-emerald-400',
    borderColor: 'border-emerald-400/20',
    bgGlow: 'shadow-[0_0_30px_rgba(34,197,94,0.06)]',
    icon: Cpu,
    technologies: ['YOLOv8x', 'ByteTrack', 'EasyOCR', 'OpenCV 4.9', 'TensorRT'],
    metric: '94.8%',
    metricLabel: 'mAP@50',
  },
  {
    id: 'database',
    category: vi.architecture.databaseLabel,
    color: 'text-amber-400',
    borderColor: 'border-amber-400/20',
    bgGlow: 'shadow-[0_0_30px_rgba(245,158,11,0.06)]',
    icon: Database,
    technologies: ['PostgreSQL 16', 'Redis 7.2', 'TimescaleDB', 'PostGIS'],
    metric: '50K',
    metricLabel: 'QPS Đỉnh',
  },
  {
    id: 'streaming',
    category: vi.architecture.streaming,
    color: 'text-pink-400',
    borderColor: 'border-pink-400/20',
    bgGlow: 'shadow-[0_0_30px_rgba(236,72,153,0.06)]',
    icon: Globe,
    technologies: ['WebRTC', 'RTSP', 'HLS', 'GStreamer', 'FFmpeg'],
    metric: '30 FPS',
    metricLabel: vi.architecture.throughput,
  },
  {
    id: 'deploy',
    category: vi.architecture.deployment,
    color: 'text-blue-400',
    borderColor: 'border-blue-400/20',
    bgGlow: 'shadow-[0_0_30px_rgba(59,130,246,0.06)]',
    icon: Container,
    technologies: ['Docker', 'Kubernetes', 'NVIDIA GPU', 'Helm', 'ArgoCD'],
    metric: '99.97%',
    metricLabel: 'Uptime',
  },
];

// Note: perfMetrics and generateSparkline have been removed and are now bound dynamically to useTrafficStore.

// ─── Sub-Components ───────────────────────────────────────────────────────────

/** Animated counter that counts up to target value */
function AnimatedCounter({ value, decimals = 0, duration = 1.5 }: { value: number; decimals?: number; duration?: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const start = 0;
    const end = value;
    const startTime = performance.now();
    const dur = duration * 1000;

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / dur, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(start + (end - start) * eased);
      if (progress < 1) requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
  }, [value, duration]);

  return <span>{display.toFixed(decimals)}</span>;
}

/** Flowing dot along a connection line */
function FlowingDot({ delay, duration = 2 }: { delay: number; duration?: number }) {
  return (
    <motion.div
      className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-cyan-400"
      style={{
        boxShadow: '0 0 8px rgba(0,212,255,0.8), 0 0 16px rgba(0,212,255,0.4)',
      }}
      initial={{ left: '-4px', opacity: 0 }}
      animate={{
        left: ['0%', '100%'],
        opacity: [0, 1, 1, 0],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'linear',
      }}
    />
  );
}

/** Connection line between pipeline nodes */
function ConnectionLine({ index }: { index: number }) {
  const baseDelay = (index + 1) * 0.2 + 0.5;

  return (
    <motion.div
      className="relative flex-1 min-w-[40px] h-[2px] self-center mx-0"
      initial={{ scaleX: 0, opacity: 0 }}
      animate={{ scaleX: 1, opacity: 1 }}
      transition={{ duration: 0.4, delay: baseDelay, ease: 'easeOut' }}
      style={{
        background: `linear-gradient(90deg, rgba(0,212,255,0.6), rgba(168,85,247,0.6))`,
        transformOrigin: 'left center',
      }}
    >
      {/* Glow */}
      <div
        className="absolute inset-0 blur-sm"
        style={{
          background: `linear-gradient(90deg, rgba(0,212,255,0.3), rgba(168,85,247,0.3))`,
        }}
      />
      {/* Flowing dots */}
      <FlowingDot delay={baseDelay + 0.8} duration={1.8} />
      <FlowingDot delay={baseDelay + 1.7} duration={1.8} />
    </motion.div>
  );
}

/** Single pipeline node card */
function PipelineNodeCard({ node, index }: { node: PipelineNode; index: number }) {
  const Icon = node.icon;

  return (
    <motion.div
      className="relative flex-shrink-0"
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: index * 0.2, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Pulse glow behind */}
      <motion.div
        className="absolute inset-0 rounded-xl"
        animate={{
          boxShadow: [
            '0 0 0px rgba(0,212,255,0)',
            '0 0 20px rgba(0,212,255,0.1)',
            '0 0 0px rgba(0,212,255,0)',
          ],
        }}
        transition={{ duration: 3, repeat: Infinity, delay: index * 0.3 }}
      />

      <div className="relative w-[140px] h-[120px] bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-xl p-3 flex flex-col items-center justify-center gap-1.5 group hover:border-cyan-400/30 transition-all duration-300 cursor-default">
        {/* HUD corner accents */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-cyan-400/30 rounded-tl-xl" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-cyan-400/30 rounded-tr-xl" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-cyan-400/30 rounded-bl-xl" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-cyan-400/30 rounded-br-xl" />

        {/* Status dot */}
        <div className="absolute top-2 right-2 flex items-center gap-1">
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-emerald-400"
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ boxShadow: '0 0 6px rgba(34,197,94,0.6)' }}
          />
        </div>

        {/* Icon */}
        <div className="w-8 h-8 rounded-lg bg-cyan-400/10 flex items-center justify-center group-hover:bg-cyan-400/20 transition-colors">
          <Icon className="w-4 h-4 text-cyan-400" />
        </div>

        {/* Label */}
        <span className="text-[11px] font-bold text-white text-center leading-tight">{node.label}</span>

        {/* Tech subtitle */}
        <span className="text-[9px] font-mono text-slate-500 text-center">{node.tech}</span>

        {/* Metric */}
        <div className="flex items-center gap-1 mt-auto">
          <Zap className="w-2.5 h-2.5 text-cyan-400/60" />
          <span className="text-[9px] font-mono text-cyan-400/80">{node.metric}</span>
        </div>
      </div>
    </motion.div>
  );
}

/** Infrastructure technology card */
function InfraCardComponent({ card, index }: { card: InfraCard; index: number }) {
  const Icon = card.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 2.2 + index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      className={`relative bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] ${card.borderColor} rounded-2xl p-5 hover:border-opacity-50 transition-all duration-300 group ${card.bgGlow}`}
    >
      {/* Category badge */}
      <div className="flex items-center justify-between mb-3">
        <span className={`text-[10px] font-mono uppercase tracking-widest ${card.color}`}>
          {card.category}
        </span>
        <div className={`w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center`}>
          <Icon className={`w-3.5 h-3.5 ${card.color}`} />
        </div>
      </div>

      {/* Technology list */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {card.technologies.map((tech) => (
          <span
            key={tech}
            className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/[0.06] font-mono"
          >
            {tech}
          </span>
        ))}
      </div>

      {/* Performance metric */}
      <div className="flex items-center gap-2 pt-3 border-t border-white/[0.06]">
        <span className={`text-lg font-bold ${card.color}`}>{card.metric}</span>
        <span className="text-[10px] text-slate-500 font-mono">{card.metricLabel}</span>
      </div>
    </motion.div>
  );
}

/** Performance metric card with sparkline */
function PerfMetricCard({
  metric,
  index,
  isProcessing,
  timelineData,
}: {
  metric: PerfMetric;
  index: number;
  isProcessing: boolean;
  timelineData: any[];
}) {
  const Icon = metric.icon;
  const sparkData = useMemo(() => {
    if (!isProcessing || timelineData.length === 0) {
      return Array(12).fill(0).map(() => ({ v: 0 }));
    }
    
    // Take at most last 15 points
    const points = timelineData.slice(-15);
    
    return points.map((p, idx) => {
      if (metric.id === 'throughput') return { v: p.fps };
      if (metric.id === 'latency') return { v: p.fps > 0 ? Math.round(1000 / p.fps) : 33 };
      if (metric.id === 'gpu') {
        return { v: 72 + Math.sin(idx * 0.5) * 4 };
      }
      if (metric.id === 'memory') {
        return { v: 4.4 + Math.sin(idx * 0.3) * 0.1 };
      }
      return { v: 0 };
    });
  }, [isProcessing, timelineData, metric.id]);

  const displayValue = metric.value;
  const decimals = metric.id === 'memory' ? 1 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 2.8 + index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="relative bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-4 hover:border-white/[0.12] transition-all duration-300"
    >
      {/* Top row */}
      <div className="flex items-center gap-2 mb-1">
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center"
          style={{ backgroundColor: `${metric.color}15` }}
        >
          <Icon className="w-3 h-3" style={{ color: metric.color }} />
        </div>
        <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
          {metric.label}
        </span>
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-1.5 mb-2">
        <span className="text-2xl font-bold text-white">
          <AnimatedCounter value={displayValue} decimals={decimals} duration={2} />
        </span>
        <span className="text-xs text-slate-500">{metric.unit}</span>
      </div>

      {/* Progress bar for GPU / Memory */}
      {metric.max && (
        <div className="w-full h-1 bg-white/5 rounded-full mb-2 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: metric.color }}
            initial={{ width: 0 }}
            animate={{ width: `${(metric.value / metric.max) * 100}%` }}
            transition={{ duration: 1.5, delay: 3 + index * 0.1, ease: 'easeOut' }}
          />
        </div>
      )}

      {/* Sparkline */}
      <div className="h-8 w-full mt-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sparkData}>
            <YAxis domain={['dataMin - 2', 'dataMax + 2']} hide />
            <Line
              type="monotone"
              dataKey="v"
              stroke={metric.color}
              strokeWidth={1.5}
              dot={false}
              animationDuration={2000}
              animationBegin={3000 + index * 200}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

// ─── Scanline Overlay ─────────────────────────────────────────────────────────

function ScanlineOverlay() {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.02]">
      <div
        className="w-full h-full"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
        }}
      />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const SystemArchitecture = () => {
  const fps = useTrafficStore((state) => state.fps);
  const isProcessing = useTrafficStore((state) => state.isProcessing);
  const timelineData = useTrafficStore((state) => state.timelineData);

  const liveMetrics = useMemo(() => {
    const latencyVal = isProcessing && fps > 0 ? Math.round(1000 / fps) : (isProcessing ? 33 : 0);
    const throughputVal = fps;
    const gpuVal = isProcessing ? 78 : 0;
    const memoryVal = isProcessing ? 4.6 : 1.9;

    return [
      { id: 'latency', label: vi.architecture.processingLatency, value: latencyVal, unit: 'ms', icon: Clock, color: '#00D4FF' },
      { id: 'throughput', label: vi.architecture.throughput, value: throughputVal, unit: 'FPS', icon: Activity, color: '#A855F7' },
      { id: 'gpu', label: vi.architecture.gpuUtilization, value: gpuVal, unit: '%', icon: Gauge, color: '#22C55E', max: 100 },
      { id: 'memory', label: vi.architecture.memoryUsage, value: memoryVal, unit: 'GB / 8 GB', icon: MemoryStick, color: '#F59E0B', max: 8 },
    ];
  }, [isProcessing, fps]);

  return (
    <div className="relative min-h-screen bg-slate-950 text-white overflow-x-hidden">
      <ScanlineOverlay />

      {/* Background ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-cyan-400/[0.02] rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500/[0.02] rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 p-6 lg:p-8 max-w-[1400px] mx-auto space-y-8">
        {/* ─── HEADER ────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center">
              <Network className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                {vi.architecture.title}
                <motion.div
                  className="w-2 h-2 rounded-full bg-emerald-400"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{ boxShadow: '0 0 8px rgba(34,197,94,0.5)' }}
                />
              </h1>
              <p className="text-sm text-slate-500">
                {vi.architecture.subtitle}
              </p>
            </div>
          </div>
        </motion.div>

        {/* ─── PIPELINE VISUALIZATION ─────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="relative bg-white/[0.02] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6 lg:p-8 overflow-hidden"
        >
          {/* Section label */}
          <div className="flex items-center gap-2 mb-6">
            <Layers className="w-4 h-4 text-cyan-400/60" />
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-400/60">
              {vi.architecture.dataProcessingPipeline}
            </span>
            <div className="flex-1 h-px bg-gradient-to-r from-cyan-400/20 to-transparent" />
          </div>

          {/* Pipeline */}
          <div className="flex items-center justify-center gap-0 overflow-x-auto pb-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
            {pipelineNodes.map((node, i) => (
              <div key={node.id} className="flex items-center">
                <PipelineNodeCard node={node} index={i} />
                {i < pipelineNodes.length - 1 && (
                  <ConnectionLine index={i} />
                )}
              </div>
            ))}
          </div>

          {/* Pipeline legend */}
          <motion.div
            className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-white/[0.04]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.0 }}
          >
            <div className="flex items-center gap-2">
              <motion.div
                className="w-2 h-2 rounded-full bg-emerald-400"
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-[10px] text-slate-500 font-mono">{vi.architecture.onlineLabel}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-[2px] bg-gradient-to-r from-cyan-400/60 to-purple-400/60 rounded" />
              <span className="text-[10px] text-slate-500 font-mono">{vi.architecture.dataFlow}</span>
            </div>
            <div className="flex items-center gap-2">
              <motion.div
                className="w-2 h-2 rounded-full bg-cyan-400"
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{ boxShadow: '0 0 6px rgba(0,212,255,0.6)' }}
              />
              <span className="text-[10px] text-slate-500 font-mono">{vi.architecture.activeTransfer}</span>
            </div>
          </motion.div>

          {/* Corner decorations */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-400/10 rounded-tl-2xl" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-purple-400/10 rounded-tr-2xl" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-400/10 rounded-bl-2xl" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-purple-400/10 rounded-br-2xl" />
        </motion.div>

        {/* ─── INFRASTRUCTURE CARDS ───────────────────────────────── */}
        <div>
          <motion.div
            className="flex items-center gap-2 mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.0 }}
          >
            <Server className="w-4 h-4 text-purple-400/60" />
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-purple-400/60">
              {vi.architecture.technologyStack}
            </span>
            <div className="flex-1 h-px bg-gradient-to-r from-purple-400/20 to-transparent" />
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {infraCards.map((card, i) => (
              <InfraCardComponent key={card.id} card={card} index={i} />
            ))}
          </div>
        </div>

        {/* ─── PERFORMANCE METRICS ────────────────────────────────── */}
        <div>
          <motion.div
            className="flex items-center gap-2 mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.6 }}
          >
            <Activity className="w-4 h-4 text-emerald-400/60" />
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-emerald-400/60">
              {vi.architecture.liveSystemMetrics}
            </span>
            <div className="flex-1 h-px bg-gradient-to-r from-emerald-400/20 to-transparent" />
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {liveMetrics.map((metric, i) => (
              <PerfMetricCard
                key={metric.id}
                metric={metric}
                index={i}
                isProcessing={isProcessing}
                timelineData={timelineData}
              />
            ))}
          </div>
        </div>

        {/* Bottom padding */}
        <div className="h-8" />
      </div>

      {/* CSS for custom animations */}
      <style>{`
        @keyframes flowDot {
          0% { transform: translateX(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateX(100%); opacity: 0; }
        }

        .scrollbar-thin::-webkit-scrollbar {
          height: 4px;
        }
        .scrollbar-track-transparent::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thumb-white\\/10::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
};

export default SystemArchitecture;
