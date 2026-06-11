// ══════════════════════════════════════════════════════
// SENTINEL — Command Center Dashboard
// Real-time AI traffic monitoring — all data from backend inference ONLY
// ══════════════════════════════════════════════════════

import { useState, useMemo } from 'react';
import vi from '../i18n/vi';
import { motion } from 'framer-motion';
import {
  Car,
  Gauge,
  ScanEye,
  ShieldAlert,
  Brain,
  FileText,
  Calendar,
  Activity,
  AlertTriangle,
  Info,
  ChevronRight,
  Zap,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useAnimatedCounter } from '../hooks';
import { useTrafficStore } from '../store/trafficStore';
import { useWebSocket } from '../hooks/useWebSocket';
import { EmptyState } from '../components/shared/EmptyState';
import { ProcessingOverlay } from '../components/shared/ProcessingOverlay';
import { VideoUploader } from '../components/upload/VideoUploader';
import { useAlertStore } from '../store';

// ── Animation Variants ────────────────────────────────

const pageVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

const kpiStaggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.2 },
  },
};

// ── KPI Card Component ────────────────────────────────

interface KPICardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix?: string;
  decimals?: number;
  accentColor: string;
  accentBorder: string;
  accentBg: string;
}

function KPICard({
  icon,
  label,
  value,
  suffix = '',
  decimals = 0,
  accentColor,
  accentBorder,
  accentBg,
}: KPICardProps) {
  const animatedValue = useAnimatedCounter(value, 1800, decimals);

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="glass-card relative overflow-hidden group cursor-default"
    >
      {/* Left accent border */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-[2px] ${accentBorder}`}
      />

      {/* Shimmer overlay on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent" />

      <div className="relative p-4 flex items-start gap-3">
        {/* Icon */}
        <div
          className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${accentBg}`}
        >
          <div className={accentColor}>{icon}</div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="font-mono uppercase tracking-wider text-slate-500 text-[10px] leading-none mb-1.5">
            {label}
          </p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-white text-2xl font-bold font-mono tracking-tight leading-none">
              {decimals > 0
                ? animatedValue.toFixed(decimals)
                : animatedValue.toLocaleString()}
            </span>
            {suffix && (
              <span className="text-slate-500 text-xs font-mono">
                {suffix}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Custom Chart Tooltip ──────────────────────────────

interface TooltipPayload {
  value: number;
  dataKey: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

function CustomChartTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-cyan-400 font-mono text-xs font-semibold mb-1">
        {label}
      </p>
      {payload.map((entry, i) => (
        <p key={i} className="text-white text-sm font-mono">
          <span className="text-slate-400 text-xs">{entry.dataKey}: </span>
          {typeof entry.value === 'number'
            ? entry.value.toLocaleString()
            : entry.value}
        </p>
      ))}
    </div>
  );
}

// ── Alert Item ────────────────────────────────────────

interface AlertItemProps {
  alert: {
    id: string;
    type: 'critical' | 'warning' | 'info';
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
  };
}

function AlertItem({ alert }: AlertItemProps) {
  const dotColor: Record<string, string> = {
    critical: 'bg-red-400 shadow-[0_0_6px_rgba(239,68,68,0.5)]',
    warning: 'bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.5)]',
    info: 'bg-cyan-400 shadow-[0_0_6px_rgba(0,212,255,0.5)]',
  };

  const IconComponent =
    alert.type === 'critical'
      ? ShieldAlert
      : alert.type === 'warning'
        ? AlertTriangle
        : Info;

  return (
    <motion.div
      whileHover={{
        backgroundColor: 'rgba(255,255,255,0.03)',
        x: 2,
      }}
      className={`flex items-start gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors ${
        alert.read ? 'opacity-60' : ''
      }`}
    >
      {/* Indicator dot */}
      <div className="pt-1 shrink-0">
        <div className={`w-2 h-2 rounded-full ${dotColor[alert.type]}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <IconComponent
            className={`w-3.5 h-3.5 ${
              alert.type === 'critical'
                ? 'text-red-400'
                : alert.type === 'warning'
                  ? 'text-amber-400'
                  : 'text-cyan-400'
            }`}
          />
          <span className="text-white text-sm font-medium truncate">
            {alert.title}
          </span>
        </div>
        <p className="text-slate-500 text-xs truncate">{alert.message}</p>
        <p className="text-slate-600 text-[10px] font-mono mt-1">
          {alert.timestamp}
        </p>
      </div>

      <ChevronRight className="w-3.5 h-3.5 text-slate-700 shrink-0 mt-1" />
    </motion.div>
  );
}


// ══════════════════════════════════════════════════════
// MAIN DASHBOARD COMPONENT
// ══════════════════════════════════════════════════════

export default function Dashboard() {
  // ── Real-time AI Store — SINGLE SOURCE OF TRUTH ──
  const {
    statistics,
    violations,
    fps,
    sessionId,
    isProcessing,
    ocrResults,
    timelineData,
  } = useTrafficStore();

  // Connect WebSocket when we have a sessionId
  useWebSocket(sessionId);

  const alerts = useAlertStore((s) => s.alerts);

  // Determine if we have an active AI session with data
  const hasSession = sessionId !== null;
  const hasData = statistics.total_vehicles > 0;

  // ── Vehicle distribution for pie chart ──
  const vehicleDistribution = useMemo(() => [
    { name: vi.common.car, value: statistics.car, color: '#00D4FF' },
    { name: vi.common.motorbike, value: statistics.motorbike, color: '#A855F7' },
    { name: vi.common.truck, value: statistics.truck, color: '#F59E0B' },
    { name: vi.common.bus, value: statistics.bus, color: '#22C55E' },
  ], [statistics]);

  const totalVehicles = useMemo(
    () => vehicleDistribution.reduce((sum, v) => sum + v.value, 0),
    [vehicleDistribution]
  );

  const [hoveredPieIndex, setHoveredPieIndex] = useState<number | null>(null);

  const today = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // ── KPI Definitions — ALL from real store ──
  const kpiCards: KPICardProps[] = [
    {
      icon: <Car className="w-5 h-5" />,
      label: vi.dashboard.totalVehicles,
      value: statistics.total_vehicles,
      accentColor: 'text-cyan-400',
      accentBorder: 'bg-cyan-400',
      accentBg: 'bg-cyan-400/10',
    },
    {
      icon: <Activity className="w-5 h-5" />,
      label: 'FPS Xử lý',
      value: fps,
      decimals: 1,
      accentColor: 'text-purple-400',
      accentBorder: 'bg-purple-400',
      accentBg: 'bg-purple-400/10',
    },
    {
      icon: <Gauge className="w-5 h-5" />,
      label: vi.common.car,
      value: statistics.car,
      accentColor: 'text-amber-400',
      accentBorder: 'bg-amber-400',
      accentBg: 'bg-amber-400/10',
    },
    {
      icon: <ScanEye className="w-5 h-5" />,
      label: 'OCR Biển số',
      value: ocrResults.length,
      accentColor: 'text-emerald-400',
      accentBorder: 'bg-emerald-400',
      accentBg: 'bg-emerald-400/10',
    },
    {
      icon: <ShieldAlert className="w-5 h-5" />,
      label: vi.dashboard.violationsToday,
      value: violations.length,
      accentColor: 'text-red-400',
      accentBorder: 'bg-red-400',
      accentBg: 'bg-red-400/10',
    },
    {
      icon: <Brain className="w-5 h-5" />,
      label: vi.common.motorbike,
      value: statistics.motorbike,
      accentColor: 'text-purple-400',
      accentBorder: 'bg-purple-400',
      accentBg: 'bg-purple-400/10',
    },
  ];

  // ══════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 p-6 min-h-screen"
    >
      {/* ── 1. PAGE HEADER ────────────────────────────── */}
      <motion.div
        variants={sectionVariants}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className={`w-2 h-2 rounded-full ${
              isProcessing
                ? 'bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(0,212,255,0.6)]'
                : hasData
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                  : 'bg-slate-600'
            }`} />
            <h1 className="text-3xl font-bold text-white text-glow-blue tracking-tight">
              {vi.dashboard.title}
            </h1>
          </div>
          <p className="text-slate-500 text-sm pl-5">
            {isProcessing
              ? 'Đang xử lý video — dữ liệu AI thời gian thực'
              : hasData
                ? vi.dashboard.subtitle
                : 'Tải lên video để bắt đầu phân tích AI'}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-mono">
            <Calendar className="w-3.5 h-3.5" />
            {today}
          </div>
          {hasData && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-neon flex items-center gap-2 text-sm"
            >
              <FileText className="w-4 h-4" />
              {vi.dashboard.generateReport}
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* ── Processing Overlay ── */}
      {hasSession && <ProcessingOverlay />}

      {/* ── Upload prompt when no session ── */}
      {!hasSession && (
        <motion.div variants={sectionVariants}>
          <VideoUploader />
        </motion.div>
      )}

      {/* ── 2. KPI STRIP ─────────────────────────────── */}
      <motion.div
        variants={kpiStaggerContainer}
        className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3"
      >
        {kpiCards.map((kpi) => (
          <KPICard key={kpi.label} {...kpi} />
        ))}
      </motion.div>

      {/* ── 3. MAIN CONTENT GRID ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* ── Traffic Flow Chart (3/5 width) ── */}
        <motion.div
          variants={sectionVariants}
          className="lg:col-span-3 glass-card p-5"
        >
          {/* Card Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-400/10 flex items-center justify-center">
                <Activity className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-white text-sm font-semibold">
                  Lưu lượng Phương tiện — Thời gian thực
                </h3>
                <p className="text-slate-600 text-[10px] font-mono uppercase tracking-wider">
                  {vi.dashboard.vehicleCountPerHour}
                </p>
              </div>
            </div>
            {isProcessing && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-400/5 border border-cyan-400/10">
                <Zap className="w-3 h-3 text-cyan-400" />
                <span className="text-cyan-400 text-[10px] font-mono uppercase tracking-wider">
                  {vi.dashboard.live}
                </span>
              </div>
            )}
          </div>

          {/* Chart or empty state */}
          {timelineData.length > 1 ? (
            <div className="h-[280px] -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={timelineData}
                  margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="trafficGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#00D4FF" stopOpacity={0.3} />
                      <stop offset="50%" stopColor="#00D4FF" stopOpacity={0.08} />
                      <stop offset="100%" stopColor="#00D4FF" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id="lineGradient"
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="0"
                    >
                      <stop offset="0%" stopColor="#06B6D4" />
                      <stop offset="50%" stopColor="#00D4FF" />
                      <stop offset="100%" stopColor="#A855F7" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.04)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#475569', fontSize: 10, fontFamily: 'monospace' }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#475569', fontSize: 10, fontFamily: 'monospace' }}
                    width={40}
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="totalVehicles"
                    stroke="url(#lineGradient)"
                    strokeWidth={2}
                    fill="url(#trafficGradient)"
                    animationDuration={800}
                    animationEasing="ease-in-out"
                    dot={false}
                    activeDot={{
                      r: 4,
                      fill: '#00D4FF',
                      stroke: '#030712',
                      strokeWidth: 2,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              icon={<Activity className="w-6 h-6" />}
              title="Chưa có dữ liệu lưu lượng"
              description="Biểu đồ sẽ hiển thị khi hệ thống AI bắt đầu xử lý video"
              compact
            />
          )}
        </motion.div>

        {/* ── Vehicle Distribution (2/5 width) ── */}
        <motion.div
          variants={sectionVariants}
          className="lg:col-span-2 glass-card p-5"
        >
          {/* Card Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-purple-400/10 flex items-center justify-center">
              <Car className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h3 className="text-white text-sm font-semibold">
                {vi.dashboard.vehicleDistribution}
              </h3>
              <p className="text-slate-600 text-[10px] font-mono uppercase tracking-wider">
                {vi.dashboard.classificationBreakdown}
              </p>
            </div>
          </div>

          {/* Donut Chart or empty state */}
          {totalVehicles > 0 ? (
            <>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={vehicleDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                      animationDuration={1200}
                      animationEasing="ease-out"
                      onMouseEnter={(_, index) => setHoveredPieIndex(index)}
                      onMouseLeave={() => setHoveredPieIndex(null)}
                    >
                      {vehicleDistribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          opacity={
                            hoveredPieIndex === null || hoveredPieIndex === index
                              ? 1
                              : 0.3
                          }
                          style={{
                            filter:
                              hoveredPieIndex === index
                                ? `drop-shadow(0 0 8px ${entry.color}60)`
                                : 'none',
                            transition: 'all 0.3s ease',
                          }}
                        />
                      ))}
                    </Pie>
                    <text
                      x="50%"
                      y="46%"
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="fill-white text-xl font-bold"
                      style={{ fontFamily: 'monospace' }}
                    >
                      {totalVehicles.toLocaleString()}
                    </text>
                    <text
                      x="50%"
                      y="56%"
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="fill-slate-500"
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '9px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                      }}
                    >
                      {vi.dashboard.total}
                    </text>
                    <Tooltip content={<CustomChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-3 px-1">
                {vehicleDistribution.map((item, i) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.08 }}
                    className="flex items-center gap-2 group cursor-default"
                    onMouseEnter={() => setHoveredPieIndex(i)}
                    onMouseLeave={() => setHoveredPieIndex(null)}
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-sm shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-slate-400 text-xs group-hover:text-white transition-colors truncate">
                      {item.name}
                    </span>
                    <span className="text-slate-600 text-[10px] font-mono ml-auto">
                      {item.value.toLocaleString()}
                    </span>
                  </motion.div>
                ))}
              </div>
            </>
          ) : (
            <EmptyState
              icon={<Car className="w-6 h-6" />}
              title="Chưa phát hiện phương tiện"
              description="Phân bố phương tiện sẽ hiển thị khi AI nhận diện xe từ video"
              compact
            />
          )}
        </motion.div>
      </div>

      {/* ── 4. BOTTOM ROW: RECENT ALERTS ──── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* ── OCR Results (2/3 width) ── */}
        <motion.div
          variants={sectionVariants}
          className="xl:col-span-2 glass-card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-400/10 flex items-center justify-center">
                <ScanEye className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-white text-sm font-semibold">Kết quả OCR Biển số</h3>
                <p className="text-slate-600 text-[10px] font-mono uppercase tracking-wider">
                  Nhận dạng biển số tự động
                </p>
              </div>
            </div>
            <span className="text-slate-600 text-[10px] font-mono">
              {ocrResults.length} biển số
            </span>
          </div>

          {ocrResults.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left py-2 px-3 text-[10px] font-mono uppercase text-slate-500 tracking-wider">Track ID</th>
                    <th className="text-left py-2 px-3 text-[10px] font-mono uppercase text-slate-500 tracking-wider">Biển số</th>
                    <th className="text-left py-2 px-3 text-[10px] font-mono uppercase text-slate-500 tracking-wider">Độ tin cậy</th>
                    <th className="text-left py-2 px-3 text-[10px] font-mono uppercase text-slate-500 tracking-wider">Loại xe</th>
                  </tr>
                </thead>
                <tbody>
                  {ocrResults.slice(0, 10).map((ocr) => (
                    <tr key={ocr.track_id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                      <td className="py-2 px-3 font-mono text-cyan-400 text-xs">#{ocr.track_id}</td>
                      <td className="py-2 px-3 font-mono text-white text-xs font-semibold">{ocr.text}</td>
                      <td className="py-2 px-3">
                        <span className={`text-xs font-mono ${ocr.confidence > 0.8 ? 'text-emerald-400' : ocr.confidence > 0.5 ? 'text-amber-400' : 'text-red-400'}`}>
                          {(ocr.confidence * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-400 text-xs capitalize">{ocr.vehicle_class}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={<ScanEye className="w-5 h-5" />}
              title="Chưa có kết quả OCR"
              description="Biển số xe sẽ được nhận dạng tự động khi AI xử lý video"
              compact
            />
          )}
        </motion.div>

        {/* ── Recent Alerts (1/3 width) ── */}
        <motion.div
          variants={sectionVariants}
          className="xl:col-span-1 glass-card p-5"
        >
          {/* Card Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-400/10 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4 text-red-400" />
              </div>
              <div>
                <h3 className="text-white text-sm font-semibold">
                  {vi.dashboard.recentAlerts}
                </h3>
                <p className="text-slate-600 text-[10px] font-mono uppercase tracking-wider">
                  {vi.dashboard.criticalEvents}
                </p>
              </div>
            </div>
            {alerts.filter((a) => !a.read).length > 0 && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-400/5 border border-red-400/10">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                <span className="text-red-400 text-[10px] font-mono">
                  {alerts.filter((a) => !a.read).length} Mới
                </span>
              </div>
            )}
          </div>

          {/* Alerts List */}
          {alerts.length > 0 ? (
            <div className="space-y-1 -mx-1">
              {alerts.slice(0, 5).map((alert, i) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: 0.1 + i * 0.08,
                    duration: 0.4,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <AlertItem alert={alert} />
                </motion.div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<ShieldAlert className="w-5 h-5" />}
              title="Không có cảnh báo"
              description="Cảnh báo sẽ xuất hiện khi AI phát hiện vi phạm giao thông"
              compact
            />
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
