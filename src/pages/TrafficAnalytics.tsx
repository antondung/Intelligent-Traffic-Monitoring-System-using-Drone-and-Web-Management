import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Car,
  Gauge,
  Activity,
  ShieldAlert,
  Layers,
  MapPin,
  AlertTriangle,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { useAnimatedCounter } from '../hooks';
import { useTrafficStore } from '../store/trafficStore';
import { EmptyState } from '../components/shared/EmptyState';
import { VideoUploader } from '../components/upload/VideoUploader';

/* ─── animation helpers ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const sectionFade = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.2 + i * 0.1, duration: 0.5 },
  }),
};

/* ─── congestion heatmap helpers ─── */
const days = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

function heatColor(v: number): string {
  if (v === 0) return 'rgba(255,255,255,0.02)';
  if (v < 25) return 'rgba(34,197,94,0.6)';
  if (v < 50) return 'rgba(234,179,8,0.5)';
  if (v < 75) return 'rgba(249,115,22,0.55)';
  return 'rgba(239,68,68,0.65)';
}

/* ─── hotspots ─── */
const hotspots = [
  { location: 'Nguyễn Trãi × Lê Lợi', congestion: 87, vehiclesPerHr: 842, status: 'critical' },
  { location: 'Tuyến Võ Văn Kiệt', congestion: 72, vehiclesPerHr: 631, status: 'high' },
  { location: 'Cách Mạng Tháng 8', congestion: 58, vehiclesPerHr: 523, status: 'moderate' },
  { location: 'Đại lộ Điện Biên Phủ', congestion: 45, vehiclesPerHr: 412, status: 'moderate' },
  { location: 'Đại lộ Hai Bà Trưng', congestion: 31, vehiclesPerHr: 298, status: 'low' },
];

const statusColors: Record<string, string> = {
  critical: 'text-red-400 bg-red-400/10 border-red-400/20',
  high: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  moderate: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  low: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
};



/* ─── custom tooltip ─── */
function GlassTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-slate-900/90 backdrop-blur-xl px-3 py-2 shadow-xl">
      <div className="text-[10px] font-mono text-slate-400 mb-1">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <div className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-300">{p.name}:</span>
          <span className="font-semibold text-white">{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */

export default function TrafficAnalytics() {
  const [timeRange, setTimeRange] = useState('24H');
  const ranges = ['1H', '6H', '24H', '7D', '30D'];

  // ── Real-time AI Store — SINGLE SOURCE OF TRUTH ──
  const { statistics, violations, timelineData, sessionId } = useTrafficStore();

  // ── Heatmap grid: completely empty or deterministic ──
  const heatmapData = useMemo(() => {
    if (!sessionId) {
      return Array.from({ length: 24 }, () => Array.from({ length: 7 }, () => 0));
    }
    return Array.from({ length: 24 }, (_, h) =>
      Array.from({ length: 7 }, (_, d) => {
        const isPeak = (h >= 7 && h <= 9) || (h >= 17 && h <= 19);
        const isNight = h >= 22 || h <= 5;
        const base = isNight ? 8 : isPeak ? 78 : 38;
        const variation = Math.sin(h * 0.5) * 10 + Math.cos(d * 0.8) * 5;
        return Math.min(100, Math.max(0, Math.floor(base + variation)));
      })
    );
  }, [sessionId]);

  // If there is no active session, render a premium glassmorphic EmptyState with VideoUploader
  if (!sessionId) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col items-center justify-center min-h-[80vh] space-y-6 p-4"
      >
        <div className="text-center max-w-lg space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-cyan-500/10 border border-cyan-400/20 mb-2">
            <BarChart3 size={36} className="text-cyan-400" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Phân Tích Giao Thông</h1>
          <p className="text-sm text-slate-500 font-mono">
            Phân Tích Lưu Lượng & Bản Đồ Nhiệt Tắc Nghẽn
          </p>
        </div>

        <div className="w-full max-w-2xl bg-white/[0.02] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6 shadow-2xl">
          <EmptyState
            icon={<Activity size={24} className="text-slate-500 animate-pulse" />}
            title="Đường ống AI chưa có dữ liệu"
            description="SENTINEL yêu cầu một video giao thông để tổng hợp và hiển thị bản đồ nhiệt cùng các chỉ số lưu lượng. Vui lòng kéo & thả một file video camera giám sát hoặc drone của bạn bên dưới."
          />
          <VideoUploader />
        </div>
      </motion.div>
    );
  }

  // ── Vehicle distribution from real stats ──
  const vehicleDist = useMemo(() => [
    { name: 'Ô tô', value: statistics.car, color: '#00D4FF' },
    { name: 'Xe máy', value: statistics.motorbike, color: '#A855F7' },
    { name: 'Xe tải', value: statistics.truck, color: '#F59E0B' },
    { name: 'Xe buýt', value: statistics.bus, color: '#22C55E' },
  ], [statistics]);

  const totalVehicles = useMemo(() => vehicleDist.reduce((s, d) => s + d.value, 0), [vehicleDist]);
  const animatedTotal = useAnimatedCounter(totalVehicles, 1200);
  const animatedViolations = useAnimatedCounter(violations.length, 1000);

  /* ─── KPI config ─── */
  const kpis = [
    { label: 'Tổng phương tiện', value: animatedTotal.toLocaleString(), icon: Car, color: 'cyan', accent: 'border-l-cyan-400' },
    { label: 'Ô tô', value: String(statistics.car), icon: Car, color: 'amber', accent: 'border-l-amber-400' },
    { label: 'Xe máy', value: String(statistics.motorbike), icon: Activity, color: 'purple', accent: 'border-l-purple-400' },
    { label: 'Xe tải', value: String(statistics.truck), icon: Gauge, color: 'emerald', accent: 'border-l-emerald-400' },
    { label: 'Vi phạm Phát hiện', value: String(animatedViolations), icon: ShieldAlert, color: 'red', accent: 'border-l-red-400' },
    { label: 'Xe buýt', value: String(statistics.bus), icon: Layers, color: 'orange', accent: 'border-l-orange-400' },
  ];

  const iconColors: Record<string, string> = {
    cyan: 'text-cyan-400 bg-cyan-400/10',
    amber: 'text-amber-400 bg-amber-400/10',
    emerald: 'text-emerald-400 bg-emerald-400/10',
    orange: 'text-orange-400 bg-orange-400/10',
    red: 'text-red-400 bg-red-400/10',
    purple: 'text-purple-400 bg-purple-400/10',
  };

  /* ─── heatmap tooltip ─── */
  const [hoveredCell, setHoveredCell] = useState<{ day: string; hour: number; value: number } | null>(null);

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10">
            <BarChart3 className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Phân tích Giao thông</h1>
            <p className="text-xs text-slate-500">Phân tích lưu lượng và xu hướng giao thông toàn diện</p>
          </div>
        </div>

        {/* Time range pills */}
        <div className="flex items-center gap-1 rounded-xl bg-white/[0.03] border border-white/[0.06] p-1">
          {ranges.map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                timeRange === r
                  ? 'bg-cyan-400/15 text-cyan-400 border border-cyan-400/30'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.04] border border-transparent'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.label}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className={`glass-card p-4 border-l-2 ${kpi.accent} hover:shadow-lg transition-all`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${iconColors[kpi.color]}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">{kpi.label}</span>
              </div>
              <div className="text-lg font-bold text-white">{kpi.value}</div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Traffic Flow Chart (full width) ── */}
      <motion.div custom={0} variants={sectionFade} initial="hidden" animate="show" className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-white">Lưu lượng Giao thông Thời gian thực</h2>
            <p className="text-[10px] text-slate-500 font-mono">PHƯƠNG TIỆN & TỐC ĐỘ — 24H</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-cyan-400" />
              <span className="text-[10px] text-slate-400">Phương tiện</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-purple-400" />
              <span className="text-[10px] text-slate-400">Tốc độ TB</span>
            </div>
          </div>
        </div>
        {timelineData.length > 1 ? (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={timelineData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="gradVehicles" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00D4FF" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#00D4FF" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradFps" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#A855F7" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#A855F7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="label" tick={{ fill: '#64748B', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis yAxisId="left" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<GlassTooltip />} />
              <Area yAxisId="left" type="monotone" dataKey="totalVehicles" stroke="#00D4FF" strokeWidth={2} fill="url(#gradVehicles)" name="Phương tiện" animationDuration={1500} />
              <Area yAxisId="right" type="monotone" dataKey="fps" stroke="#A855F7" strokeWidth={2} fill="url(#gradFps)" name="FPS" animationDuration={1800} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState
            icon={<Activity className="w-5 h-5" />}
            title="Chưa có dữ liệu lưu lượng"
            description="Biểu đồ sẽ hiển thị khi AI bắt đầu xử lý video"
            compact
          />
        )}
      </motion.div>

      {/* ── Charts Row: Heatmap + Distribution ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Congestion Heatmap */}
        <motion.div custom={1} variants={sectionFade} initial="hidden" animate="show" className="glass-card p-5">
          <h2 className="text-sm font-semibold text-white mb-1">Bản đồ Nhiệt Tắc nghẽn</h2>
          <p className="text-[10px] text-slate-500 font-mono mb-4">MÔ HÌNH TUẦN — THEO GIờ</p>

          <div className="relative overflow-x-auto">
            {/* Column headers */}
            <div className="flex ml-10 mb-1">
              {days.map((d) => (
                <div key={d} className="flex-1 text-center text-[9px] font-mono text-slate-500">{d}</div>
              ))}
            </div>

            {/* Grid */}
            <div className="space-y-[2px]">
              {heatmapData.map((row, h) => (
                <div key={h} className="flex items-center gap-[2px]">
                  <span className="w-9 text-right text-[9px] font-mono text-slate-600 pr-1">
                    {String(h).padStart(2, '0')}:00
                  </span>
                  {row.map((val, d) => (
                    <div
                      key={d}
                      className="flex-1 aspect-square rounded-[3px] cursor-pointer transition-all hover:scale-110 hover:z-10 relative"
                      style={{ backgroundColor: heatColor(val), minWidth: '16px', maxWidth: '28px', minHeight: '12px' }}
                      onMouseEnter={() => setHoveredCell({ day: days[d], hour: h, value: val })}
                      onMouseLeave={() => setHoveredCell(null)}
                    />
                  ))}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-3 mt-3">
              {[
                { label: 'Thấp', color: 'rgba(34,197,94,0.6)' },
                { label: 'Trung bình', color: 'rgba(234,179,8,0.5)' },
                { label: 'Cao', color: 'rgba(249,115,22,0.55)' },
                { label: 'Nguy cấp', color: 'rgba(239,68,68,0.65)' },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-1">
                  <div className="h-2.5 w-2.5 rounded-sm" style={{ background: l.color }} />
                  <span className="text-[9px] text-slate-500">{l.label}</span>
                </div>
              ))}
            </div>

            {/* Tooltip */}
            {hoveredCell && (
              <div className="absolute top-2 right-2 z-20 rounded-lg bg-slate-900/95 border border-white/10 backdrop-blur-xl px-3 py-2 shadow-xl">
                <div className="text-[10px] font-mono text-slate-400">{hoveredCell.day} {String(hoveredCell.hour).padStart(2, '0')}:00</div>
                <div className="text-sm font-bold text-white">{hoveredCell.value}% tắc nghẽn</div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Vehicle Distribution */}
        <motion.div custom={2} variants={sectionFade} initial="hidden" animate="show" className="glass-card p-5">
          <h2 className="text-sm font-semibold text-white mb-1">Phân bố Loại phương tiện</h2>
          <p className="text-[10px] text-slate-500 font-mono mb-4">PHÂN LOẠI NHẬN DIỆN</p>

          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={vehicleDist}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
                animationDuration={1500}
                stroke="none"
              >
                {vehicleDist.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<GlassTooltip />} />
              <text x="50%" y="47%" textAnchor="middle" fill="#fff" fontSize="18" fontWeight="bold">
                {totalVehicles.toLocaleString()}
              </text>
              <text x="50%" y="57%" textAnchor="middle" fill="#64748B" fontSize="9" fontFamily="JetBrains Mono">
                TỔNG
              </text>
            </PieChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-3 gap-2 mt-2">
            {vehicleDist.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                <span className="text-[10px] text-slate-400 truncate">{d.name}</span>
                <span className="text-[10px] font-semibold text-white ml-auto">{d.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Charts Row: Vehicle Class Bar + Empty placeholder ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Vehicle Class Bar Chart */}
        <motion.div custom={3} variants={sectionFade} initial="hidden" animate="show" className="glass-card p-5">
          <h2 className="text-sm font-semibold text-white mb-1">Phương tiện theo Loại</h2>
          <p className="text-[10px] text-slate-500 font-mono mb-4">TỪ DỮ LIỆU AI</p>

          {totalVehicles > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={vehicleDist} margin={{ top: 0, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<GlassTooltip />} />
                <Bar dataKey="value" name="Phương tiện" radius={[4, 4, 0, 0]} animationDuration={1200}>
                  {vehicleDist.map((entry, i) => (
                    <Cell key={i} fill={entry.color} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState
              icon={<Car className="w-5 h-5" />}
              title="Chưa có dữ liệu phương tiện"
              description="Dữ liệu sẽ hiển thị khi AI bắt đầu xử lý video"
              compact
            />
          )}
        </motion.div>

        {/* FPS Timeline */}
        <motion.div custom={4} variants={sectionFade} initial="hidden" animate="show" className="glass-card p-5">
          <h2 className="text-sm font-semibold text-white mb-1">Hiệu suất Xử lý AI</h2>
          <p className="text-[10px] text-slate-500 font-mono mb-4">FPS THEO THỜI GIAN</p>

          {timelineData.length > 1 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={timelineData} margin={{ top: 0, right: 5, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradFps2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22C55E" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="label" tick={{ fill: '#64748B', fontSize: 9 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<GlassTooltip />} />
                <Area type="monotone" dataKey="fps" stroke="#22C55E" strokeWidth={2} fill="url(#gradFps2)" name="FPS" animationDuration={1200} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState
              icon={<Activity className="w-5 h-5" />}
              title="Chưa có dữ liệu FPS"
              description="Hiệu suất xử lý sẽ hiển thị khi AI đang chạy"
              compact
            />
          )}
        </motion.div>
      </div>

      {/* ── Data Tables Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Lane Traffic Summary */}
        <motion.div custom={5} variants={sectionFade} initial="hidden" animate="show" className="glass-card p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Tóm tắt Phân tích AI</h2>
          <EmptyState
            icon={<Layers className="w-5 h-5" />}
            title="Chưa có phân tích chi tiết"
            description="Bảng tóm tắt sẽ hiển thị sau khi AI xử lý video"
            compact
          />
        </motion.div>

        {/* Traffic Hotspots */}
        <motion.div custom={6} variants={sectionFade} initial="hidden" animate="show" className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Điểm nóng Giao thông</h2>
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="h-3 w-3 text-amber-400" />
              <span className="text-[10px] text-slate-500 font-mono">TRỰC TIẾP</span>
            </div>
          </div>
          <div className="space-y-2">
            {hotspots.map((spot, i) => (
              <motion.div
                key={spot.location}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.08 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-all"
              >
                <MapPin className="h-4 w-4 text-slate-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-white truncate">{spot.location}</div>
                  <div className="text-[10px] text-slate-500 font-mono">{spot.vehiclesPerHr} xe/giờ</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-bold text-white font-mono">{spot.congestion}%</div>
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-medium border capitalize ${statusColors[spot.status]}`}>
                    {spot.status}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
