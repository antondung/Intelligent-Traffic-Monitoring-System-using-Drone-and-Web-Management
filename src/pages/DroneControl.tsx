import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plane,
  AlertTriangle,
  Play,
  Home,
  Route,
  RotateCw,
  ZoomIn,
  Battery,
  Signal,
  Camera,
  Clock,
  MapPin,
  Navigation,
  Compass,
  ChevronRight,
  Wifi,
  ArrowUp,
  Gauge,
} from 'lucide-react';

// ─── TYPES ──────────────────────────────────────────────────────────────────────

interface DroneData {
  id: string;
  name: string;
  status: 'active' | 'returning' | 'idle' | 'patrol';
  battery: number;
  altitude: number;
  speed: number;
  signal: number; // 1-5
  cameraAngle: number;
  uptime: string;
  mission: string;
  gps: { lat: number; lng: number };
  position: { x: number; y: number }; // % position on map
  color: string;
  flightPath?: { x: number; y: number }[];
}

interface MissionEvent {
  id: number;
  time: string;
  droneId: string;
  droneColor: string;
  event: string;
  type: 'info' | 'warning' | 'success' | 'alert';
}

// ─── MOCK DATA ──────────────────────────────────────────────────────────────────

const drones: DroneData[] = [
  {
    id: 'D-01',
    name: 'Falcon Alpha',
    status: 'active',
    battery: 87,
    altitude: 142,
    speed: 34,
    signal: 5,
    cameraAngle: -25,
    uptime: '02:34:18',
    mission: 'Giám sát giao thông cao tốc tuyến A7',
    gps: { lat: 10.7769, lng: 106.7009 },
    position: { x: 35, y: 28 },
    color: '#00D4FF',
    flightPath: [
      { x: 15, y: 45 },
      { x: 22, y: 38 },
      { x: 28, y: 32 },
      { x: 35, y: 28 },
    ],
  },
  {
    id: 'D-02',
    name: 'Hawk Beta',
    status: 'active',
    battery: 62,
    altitude: 98,
    speed: 28,
    signal: 4,
    cameraAngle: -15,
    uptime: '01:12:45',
    mission: 'Giám sát ngã tư điểm nối B3-C2',
    gps: { lat: 10.7823, lng: 106.6954 },
    position: { x: 68, y: 42 },
    color: '#00D4FF',
    flightPath: [
      { x: 80, y: 65 },
      { x: 76, y: 55 },
      { x: 72, y: 48 },
      { x: 68, y: 42 },
    ],
  },
  {
    id: 'D-03',
    name: 'Eagle Gamma',
    status: 'returning',
    battery: 23,
    altitude: 65,
    speed: 42,
    signal: 3,
    cameraAngle: 0,
    uptime: '03:48:02',
    mission: 'Đang quay về căn cứ — pin yếu',
    gps: { lat: 10.7715, lng: 106.7085 },
    position: { x: 52, y: 68 },
    color: '#F59E0B',
    flightPath: [
      { x: 52, y: 68 },
      { x: 45, y: 75 },
      { x: 38, y: 80 },
      { x: 25, y: 85 },
    ],
  },
  {
    id: 'D-04',
    name: 'Osprey Delta',
    status: 'patrol',
    battery: 91,
    altitude: 175,
    speed: 22,
    signal: 5,
    cameraAngle: -45,
    uptime: '00:45:33',
    mission: 'Tuần tra tự động — Chu vi Quận 7',
    gps: { lat: 10.7891, lng: 106.6887 },
    position: { x: 22, y: 55 },
    color: '#A855F7',
    flightPath: [
      { x: 10, y: 70 },
      { x: 14, y: 62 },
      { x: 18, y: 58 },
      { x: 22, y: 55 },
    ],
  },
  {
    id: 'D-05',
    name: 'Raven Epsilon',
    status: 'idle',
    battery: 100,
    altitude: 0,
    speed: 0,
    signal: 5,
    cameraAngle: 0,
    uptime: '00:00:00',
    mission: 'Chờ lệnh tại căn cứ — sẵn sàng triển khai',
    gps: { lat: 10.7654, lng: 106.7123 },
    position: { x: 25, y: 85 },
    color: '#64748B',
  },
];

const missionEvents: MissionEvent[] = [
  { id: 1, time: '10:42:31', droneId: 'D-01', droneColor: '#00D4FF', event: 'Đã đến điểm kiểm tra 7 trên tuyến A7', type: 'success' },
  { id: 2, time: '10:41:58', droneId: 'D-03', droneColor: '#F59E0B', event: 'Khởi động quy trình quay về — pin còn 23%', type: 'warning' },
  { id: 3, time: '10:40:12', droneId: 'D-02', droneColor: '#00D4FF', event: 'Phát hiện bất thường giao thông tại điểm nối B3-C2', type: 'alert' },
  { id: 4, time: '10:38:45', droneId: 'D-04', droneColor: '#A855F7', event: 'Bắt đầu tuần tra tự động — Chu vi Quận 7', type: 'info' },
  { id: 5, time: '10:36:20', droneId: 'D-01', droneColor: '#00D4FF', event: 'Điều chỉnh góc camera -25° để quét cao tốc', type: 'info' },
  { id: 6, time: '10:34:08', droneId: 'D-02', droneColor: '#00D4FF', event: 'Đạt độ cao chỉ định 98m', type: 'success' },
  { id: 7, time: '10:31:55', droneId: 'D-05', droneColor: '#64748B', event: 'Hoàn tất kiểm tra trước bay — chờ lệnh', type: 'info' },
  { id: 8, time: '10:29:40', droneId: 'D-03', droneColor: '#F59E0B', event: 'Cảnh báo pin — mức 25%', type: 'warning' },
  { id: 9, time: '10:27:12', droneId: 'D-04', droneColor: '#A855F7', event: 'Xuất phát từ căn cứ — nhiệm vụ tuần tra', type: 'success' },
  { id: 10, time: '10:25:00', droneId: 'D-01', droneColor: '#00D4FF', event: 'Xuất phát từ căn cứ — giám sát cao tốc', type: 'success' },
];

const zones = [
  { name: 'KHU VỰC A', x: 18, y: 20, w: 30, h: 25 },
  { name: 'KHU VỰC B', x: 55, y: 15, w: 35, h: 30 },
  { name: 'KHU VỰC C', x: 10, y: 50, w: 35, h: 30 },
  { name: 'KHU VỰC D', x: 50, y: 50, w: 40, h: 35 },
];

// ─── STATUS HELPERS ─────────────────────────────────────────────────────────────

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: 'HOẠT ĐỘNG', color: 'text-cyan-400', bg: 'bg-cyan-400/15' },
  returning: { label: 'ĐANG VỀ', color: 'text-amber-400', bg: 'bg-amber-400/15' },
  idle: { label: 'CHỜ LỆNH', color: 'text-slate-400', bg: 'bg-slate-400/15' },
  patrol: { label: 'TUẦN TRA', color: 'text-purple-400', bg: 'bg-purple-400/15' },
};

const getBatteryColor = (pct: number) => {
  if (pct > 60) return '#22C55E';
  if (pct > 30) return '#F59E0B';
  return '#EF4444';
};

// ─── ANIMATION VARIANTS ─────────────────────────────────────────────────────────

const pageVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.6, staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

const glowPulse = {
  animate: {
    boxShadow: [
      '0 0 8px rgba(0,212,255,0.15)',
      '0 0 20px rgba(0,212,255,0.3)',
      '0 0 8px rgba(0,212,255,0.15)',
    ],
    transition: { duration: 2, repeat: Infinity },
  },
};

// ─── SUB-COMPONENTS ─────────────────────────────────────────────────────────────

function HudCorners({ color = 'border-cyan-400/30' }: { color?: string }) {
  const corner = `absolute w-4 h-4 ${color}`;
  return (
    <>
      <span className={`${corner} top-0 left-0 border-t-2 border-l-2 rounded-tl-sm`} />
      <span className={`${corner} top-0 right-0 border-t-2 border-r-2 rounded-tr-sm`} />
      <span className={`${corner} bottom-0 left-0 border-b-2 border-l-2 rounded-bl-sm`} />
      <span className={`${corner} bottom-0 right-0 border-b-2 border-r-2 rounded-br-sm`} />
    </>
  );
}

function GlassCard({
  children,
  className = '',
  hud = false,
  hudColor,
}: {
  children: React.ReactNode;
  className?: string;
  hud?: boolean;
  hudColor?: string;
}) {
  return (
    <div className={`relative bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl ${className}`}>
      {hud && <HudCorners color={hudColor} />}
      {children}
    </div>
  );
}

// Circular Gauge
function CircularGauge({ value, max, label, unit, color }: { value: number; max: number; label: string; unit: string; color: string }) {
  const pct = Math.min(value / max, 1);
  const r = 38;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct * 0.75); // 270 deg arc

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="100" height="100" viewBox="0 0 100 100" className="-rotate-[135deg]">
        {/* track */}
        <circle
          cx="50" cy="50" r={r}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="6"
          strokeDasharray={`${c * 0.75} ${c * 0.25}`}
          strokeLinecap="round"
        />
        {/* value arc */}
        <motion.circle
          cx="50" cy="50" r={r}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeDasharray={`${c * 0.75} ${c * 0.25}`}
          strokeLinecap="round"
          initial={{ strokeDashoffset: c * 0.75 }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          style={{ filter: `drop-shadow(0 0 6px ${color}40)` }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ marginTop: 20 }}>
        <motion.span
          className="text-xl font-bold text-white font-mono"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          key={value}
        >
          {value}
        </motion.span>
        <span className="text-[10px] text-slate-500 uppercase tracking-wider">{unit}</span>
      </div>
      <span className="text-[10px] text-slate-400 uppercase tracking-widest -mt-1">{label}</span>
    </div>
  );
}

// Signal Bars
function SignalBars({ strength }: { strength: number }) {
  return (
    <div className="flex items-end gap-0.5 h-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <motion.div
          key={i}
          className="w-1.5 rounded-sm"
          style={{
            height: `${i * 20}%`,
            backgroundColor: i <= strength ? (strength >= 4 ? '#22C55E' : strength >= 2 ? '#F59E0B' : '#EF4444') : 'rgba(255,255,255,0.08)',
          }}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: i * 0.05 }}
        />
      ))}
    </div>
  );
}

// Compass Rose
function CompassRose() {
  return (
    <div className="relative w-16 h-16">
      <div className="absolute inset-0 rounded-full border border-white/10" />
      <div className="absolute inset-1 rounded-full border border-white/5" />
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{ rotate: [0, 0] }}
      >
        <Navigation className="w-5 h-5 text-cyan-400" style={{ filter: 'drop-shadow(0 0 4px rgba(0,212,255,0.4))' }} />
      </motion.div>
      {['N', 'E', 'S', 'W'].map((d, i) => (
        <span
          key={d}
          className="absolute text-[8px] font-bold text-slate-500"
          style={{
            top: i === 0 ? '-2px' : i === 2 ? 'auto' : '50%',
            bottom: i === 2 ? '-2px' : 'auto',
            left: i === 3 ? '-2px' : i === 1 ? 'auto' : '50%',
            right: i === 1 ? '-4px' : 'auto',
            transform: (i === 0 || i === 2) ? 'translateX(-50%)' : 'translateY(-50%)',
          }}
        >
          {d}
        </span>
      ))}
    </div>
  );
}

// ─── TACTICAL MAP ───────────────────────────────────────────────────────────────

function TacticalMap({ selectedDrone, onSelectDrone }: { selectedDrone: string; onSelectDrone: (id: string) => void }) {
  const [scanLine, setScanLine] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setScanLine((prev) => (prev >= 100 ? 0 : prev + 0.3));
    }, 30);
    return () => clearInterval(interval);
  }, []);

  return (
    <GlassCard className="h-full overflow-hidden" hud hudColor="border-cyan-400/20">
      <div className="relative w-full h-full bg-slate-900/80" style={{ minHeight: 480 }}>
        {/* Grid overlay */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
            </pattern>
            <pattern id="grid-major" width="200" height="200" patternUnits="userSpaceOnUse">
              <path d="M 200 0 L 0 0 0 200" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          <rect width="100%" height="100%" fill="url(#grid-major)" />
        </svg>

        {/* Scan line effect */}
        <div
          className="absolute left-0 right-0 h-px pointer-events-none"
          style={{
            top: `${scanLine}%`,
            background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.15), transparent)',
            boxShadow: '0 0 20px 4px rgba(0,212,255,0.05)',
          }}
        />

        {/* Zone labels */}
        {zones.map((zone) => (
          <div
            key={zone.name}
            className="absolute border border-dashed pointer-events-none"
            style={{
              left: `${zone.x}%`,
              top: `${zone.y}%`,
              width: `${zone.w}%`,
              height: `${zone.h}%`,
              borderColor: 'rgba(255,255,255,0.05)',
            }}
          >
            <span className="absolute top-1 left-2 text-[9px] font-mono text-slate-600 tracking-widest">
              {zone.name}
            </span>
          </div>
        ))}

        {/* Flight paths */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {drones
            .filter((d) => d.flightPath && d.flightPath.length > 1)
            .map((drone) => {
              const points = drone.flightPath!.map((p) => `${p.x}%,${p.y}%`).join(' ');
              const isSelected = drone.id === selectedDrone;
              return (
                <polyline
                  key={drone.id}
                  points={points}
                  fill="none"
                  stroke={drone.color}
                  strokeWidth={isSelected ? 2 : 1}
                  strokeDasharray="6 4"
                  opacity={isSelected ? 0.7 : 0.25}
                  style={{
                    animation: 'dashMove 3s linear infinite',
                  }}
                />
              );
            })}
        </svg>

        {/* Base marker */}
        <div
          className="absolute flex flex-col items-center"
          style={{ left: '25%', top: '85%', transform: 'translate(-50%, -50%)' }}
        >
          <div className="w-4 h-4 border-2 border-emerald-400/50 rotate-45 flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-emerald-400/70 rotate-0" />
          </div>
          <span className="text-[8px] font-mono text-emerald-400/60 mt-1 tracking-wider">CĂN CỨ</span>
        </div>

        {/* Drone markers */}
        {drones.map((drone) => {
          const isSelected = drone.id === selectedDrone;
          const isActive = drone.status === 'active' || drone.status === 'patrol';
          return (
            <motion.button
              key={drone.id}
              className="absolute flex flex-col items-center cursor-pointer z-10"
              style={{
                left: `${drone.position.x}%`,
                top: `${drone.position.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
              onClick={() => onSelectDrone(drone.id)}
              whileHover={{ scale: 1.2 }}
            >
              {/* Pulse ring */}
              {isActive && (
                <motion.div
                  className="absolute rounded-full"
                  style={{
                    width: 32,
                    height: 32,
                    border: `1px solid ${drone.color}`,
                  }}
                  animate={{
                    scale: [1, 2],
                    opacity: [0.6, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeOut',
                  }}
                />
              )}
              {/* Outer glow */}
              {isSelected && (
                <motion.div
                  className="absolute rounded-full"
                  style={{
                    width: 28,
                    height: 28,
                    backgroundColor: `${drone.color}15`,
                    border: `1px solid ${drone.color}40`,
                  }}
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 0.8, 0.5],
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}
              {/* Dot */}
              <div
                className="w-3 h-3 rounded-full z-10"
                style={{
                  backgroundColor: drone.color,
                  boxShadow: `0 0 12px ${drone.color}80`,
                }}
              />
              {/* Label */}
              <div
                className="absolute -top-6 whitespace-nowrap px-1.5 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider"
                style={{
                  backgroundColor: isSelected ? `${drone.color}20` : 'rgba(0,0,0,0.5)',
                  color: drone.color,
                  border: isSelected ? `1px solid ${drone.color}40` : '1px solid transparent',
                }}
              >
                {drone.id}
              </div>
            </motion.button>
          );
        })}

        {/* Compass rose */}
        <div className="absolute top-4 right-4 opacity-60">
          <CompassRose />
        </div>

        {/* Scale bar */}
        <div className="absolute bottom-14 left-4 flex items-center gap-2 opacity-40">
          <div className="flex flex-col items-start gap-0.5">
            <div className="w-20 h-px bg-white/30" />
            <div className="flex justify-between w-20">
              <span className="text-[7px] font-mono text-slate-500">0</span>
              <span className="text-[7px] font-mono text-slate-500">500m</span>
            </div>
          </div>
        </div>

        {/* Coordinate labels on edges */}
        <div className="absolute top-0 left-0 right-0 flex justify-between px-6 pt-1 opacity-20">
          {['106.690°', '106.695°', '106.700°', '106.705°', '106.710°'].map((c) => (
            <span key={c} className="text-[7px] font-mono text-cyan-400">{c}</span>
          ))}
        </div>
        <div className="absolute top-0 bottom-0 left-0 flex flex-col justify-between py-6 pl-1 opacity-20">
          {['10.790°', '10.785°', '10.780°', '10.775°', '10.770°'].map((c) => (
            <span key={c} className="text-[7px] font-mono text-cyan-400">{c}</span>
          ))}
        </div>

        {/* Bottom overlay bar */}
        <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-slate-950/90 to-transparent flex items-end pb-2 px-4 justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-cyan-400/70 tracking-wider">BẢN ĐỒ CHIẾN THUẬT</span>
            <span className="text-[10px] font-mono text-slate-500">|</span>
            <span className="text-[10px] font-mono text-slate-400">10.7769°N, 106.7009°E</span>
            <span className="text-[10px] font-mono text-slate-500">|</span>
            <span className="text-[10px] font-mono text-slate-400">ZOOM: 14x</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-mono text-emerald-400/70">TRỰC TIẾP</span>
          </div>
        </div>
      </div>

      {/* Inject keyframes */}
      <style>{`
        @keyframes dashMove {
          to { stroke-dashoffset: -20; }
        }
      `}</style>
    </GlassCard>
  );
}

// ─── DRONE SELECTOR ─────────────────────────────────────────────────────────────

function DroneSelector({ selected, onSelect }: { selected: string; onSelect: (id: string) => void }) {
  return (
    <div className="flex flex-col gap-2">
      {drones.map((drone) => {
        const isSelected = drone.id === selected;
        const status = statusConfig[drone.status];
        return (
          <motion.button
            key={drone.id}
            onClick={() => onSelect(drone.id)}
            className={`
              relative flex items-center gap-3 p-2.5 rounded-xl border transition-all text-left
              ${isSelected
                ? 'bg-white/[0.06] border-cyan-400/30 shadow-[0_0_15px_rgba(0,212,255,0.1)]'
                : 'bg-white/[0.02] border-white/[0.04] hover:border-white/[0.1] hover:bg-white/[0.04]'
              }
            `}
            whileTap={{ scale: 0.98 }}
          >
            {isSelected && <HudCorners color="border-cyan-400/20" />}
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: drone.color, boxShadow: `0 0 8px ${drone.color}50` }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white truncate">{drone.name}</span>
                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${status.bg} ${status.color}`}>
                  {status.label}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-slate-500 font-mono">{drone.id}</span>
                {/* Mini battery bar */}
                <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: getBatteryColor(drone.battery) }}
                    initial={{ width: 0 }}
                    animate={{ width: `${drone.battery}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
                <span className="text-[10px] text-slate-500 font-mono">{drone.battery}%</span>
              </div>
            </div>
            {isSelected && <ChevronRight className="w-3.5 h-3.5 text-cyan-400/50 flex-shrink-0" />}
          </motion.button>
        );
      })}
    </div>
  );
}

// ─── TELEMETRY PANEL ────────────────────────────────────────────────────────────

function TelemetryPanel({ drone }: { drone: DroneData }) {
  return (
    <GlassCard className="p-4" hud hudColor="border-white/[0.08]">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
        <Gauge className="w-3.5 h-3.5 text-cyan-400" />
        Đo xa — {drone.id}
      </h3>

      {/* Altitude & Speed gauges */}
      <div className="flex items-center justify-around mb-4">
        <div className="relative flex flex-col items-center">
          <CircularGauge value={drone.altitude} max={200} label="Độ cao" unit="m" color="#00D4FF" />
        </div>
        <div className="flex flex-col gap-3 flex-1 ml-4">
          {/* Speed bar */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <ArrowUp className="w-2.5 h-2.5" /> Tốc độ
              </span>
              <span className="text-sm font-mono text-white font-bold">{drone.speed} <span className="text-[10px] text-slate-500">km/h</span></span>
            </div>
            <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400"
                initial={{ width: 0 }}
                animate={{ width: `${(drone.speed / 60) * 100}%` }}
                transition={{ duration: 1 }}
                style={{ boxShadow: '0 0 8px rgba(0,212,255,0.3)' }}
              />
            </div>
          </div>

          {/* Battery bar */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Battery className="w-2.5 h-2.5" /> Pin
              </span>
              <span className="text-sm font-mono font-bold" style={{ color: getBatteryColor(drone.battery) }}>
                {drone.battery}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: getBatteryColor(drone.battery) }}
                initial={{ width: 0 }}
                animate={{ width: `${drone.battery}%` }}
                transition={{ duration: 1 }}
              />
            </div>
          </div>

          {/* Signal */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Wifi className="w-2.5 h-2.5" /> Tín hiệu
            </span>
            <SignalBars strength={drone.signal} />
          </div>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-2 mt-2">
        {[
          { icon: Camera, label: 'Camera', value: `${drone.cameraAngle}°` },
          { icon: Clock, label: 'Thời gian bay', value: drone.uptime },
          { icon: MapPin, label: 'Toạ độ', value: `${drone.gps.lat.toFixed(4)}°N` },
          { icon: Compass, label: 'Kinh độ', value: `${drone.gps.lng.toFixed(4)}°E` },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
            <Icon className="w-3.5 h-3.5 text-slate-500" />
            <div>
              <div className="text-[9px] text-slate-500 uppercase tracking-wider">{label}</div>
              <div className="text-xs font-mono text-white">{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Mission */}
      <div className="mt-3 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
        <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">Nhiệm vụ Đang thực hiện</div>
        <div className="text-xs text-slate-300 leading-relaxed">{drone.mission}</div>
      </div>
    </GlassCard>
  );
}

// ─── CONTROL PANEL ──────────────────────────────────────────────────────────────

function ControlPanel() {
  const controls = [
    { icon: Play, label: 'Bắt đầu', color: 'cyan', glowColor: 'rgba(0,212,255,0.2)' },
    { icon: Home, label: 'Quay về', color: 'amber', glowColor: 'rgba(245,158,11,0.2)' },
    { icon: Route, label: 'Tuần tra', color: 'purple', glowColor: 'rgba(168,85,247,0.2)' },
    { icon: RotateCw, label: 'Xoay Camera', color: 'slate', glowColor: 'rgba(148,163,184,0.15)' },
    { icon: ZoomIn, label: 'Phóng to', color: 'slate', glowColor: 'rgba(148,163,184,0.15)' },
    { icon: AlertTriangle, label: 'Hạ cánh KC', color: 'red', glowColor: 'rgba(239,68,68,0.2)' },
  ];

  const colorMap: Record<string, { text: string; border: string; hoverBg: string }> = {
    cyan: { text: 'text-cyan-400', border: 'border-cyan-400/20', hoverBg: 'hover:bg-cyan-400/10' },
    amber: { text: 'text-amber-400', border: 'border-amber-400/20', hoverBg: 'hover:bg-amber-400/10' },
    purple: { text: 'text-purple-400', border: 'border-purple-400/20', hoverBg: 'hover:bg-purple-400/10' },
    slate: { text: 'text-slate-400', border: 'border-slate-400/15', hoverBg: 'hover:bg-slate-400/10' },
    red: { text: 'text-red-400', border: 'border-red-400/20', hoverBg: 'hover:bg-red-400/10' },
  };

  return (
    <div className="grid grid-cols-3 gap-2">
      {controls.map(({ icon: Icon, label, color, glowColor }) => {
        const c = colorMap[color];
        return (
          <motion.button
            key={label}
            className={`
              relative flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl
              bg-white/[0.03] border ${c.border} ${c.hoverBg}
              transition-all cursor-pointer
            `}
            whileHover={{
              scale: 1.04,
              boxShadow: `0 0 20px ${glowColor}`,
            }}
            whileTap={{ scale: 0.96 }}
          >
            <Icon className={`w-4.5 h-4.5 ${c.text}`} />
            <span className={`text-[10px] font-medium ${c.text} tracking-wide`}>{label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

// ─── MISSION LOG ────────────────────────────────────────────────────────────────

function MissionLog() {
  const typeColorMap: Record<string, string> = {
    info: 'text-slate-400',
    warning: 'text-amber-400',
    success: 'text-emerald-400',
    alert: 'text-red-400',
  };

  return (
    <GlassCard className="p-4" hud hudColor="border-white/[0.06]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          Nhật ký Nhiệm vụ
        </h3>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] text-emerald-400/70 font-mono">TRỰC TIẾP</span>
        </div>
      </div>

      <div className="space-y-1 max-h-40 overflow-y-auto scrollbar-thin pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
        {missionEvents.map((event, index) => (
          <motion.div
            key={event.id}
            className="flex items-start gap-2.5 py-1.5 px-2 rounded-lg hover:bg-white/[0.02] transition-colors"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.04 }}
          >
            <span className="text-[10px] font-mono text-slate-600 flex-shrink-0 mt-0.5">{event.time}</span>
            <span
              className="text-[10px] font-mono font-bold flex-shrink-0 px-1.5 py-0.5 rounded mt-0"
              style={{
                color: event.droneColor,
                backgroundColor: `${event.droneColor}15`,
              }}
            >
              {event.droneId}
            </span>
            <span className={`text-xs ${typeColorMap[event.type]} leading-relaxed`}>
              {event.event}
            </span>
          </motion.div>
        ))}
      </div>
    </GlassCard>
  );
}

// ─── MAIN PAGE ──────────────────────────────────────────────────────────────────

export default function DroneControl() {
  const [selectedDroneId, setSelectedDroneId] = useState('D-01');
  const selectedDrone = drones.find((d) => d.id === selectedDroneId) ?? drones[0];

  return (
    <motion.div
      className="min-h-screen bg-slate-950 p-6 space-y-5"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      {/* HEADER */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <motion.div
              className="w-11 h-11 rounded-xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center"
              {...glowPulse}
            >
              <Plane className="w-5 h-5 text-cyan-400" />
            </motion.div>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Trung tâm Điều khiển Drone</h1>
            <p className="text-xs text-slate-500 mt-0.5">Quản lý đội bay và điều phối nhiệm vụ</p>
          </div>
          {/* Fleet status pills */}
          <div className="hidden lg:flex items-center gap-2 ml-4">
            {[
              { label: 'Hoạt động', count: 2, color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
              { label: 'Tuần tra', count: 1, color: 'text-purple-400', bg: 'bg-purple-400/10' },
              { label: 'Đang về', count: 1, color: 'text-amber-400', bg: 'bg-amber-400/10' },
              { label: 'Chờ lệnh', count: 1, color: 'text-slate-400', bg: 'bg-slate-400/10' },
            ].map((s) => (
              <div key={s.label} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${s.bg}`}>
                <span className={`text-xs font-bold font-mono ${s.color}`}>{s.count}</span>
                <span className="text-[10px] text-slate-500">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Emergency Landing Button */}
        <motion.button
          className="relative flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-semibold text-sm cursor-pointer"
          animate={{
            borderColor: [
              'rgba(239,68,68,0.3)',
              'rgba(239,68,68,0.7)',
              'rgba(239,68,68,0.3)',
            ],
            boxShadow: [
              '0 0 0px rgba(239,68,68,0)',
              '0 0 20px rgba(239,68,68,0.2)',
              '0 0 0px rgba(239,68,68,0)',
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
          whileHover={{ scale: 1.05, backgroundColor: 'rgba(239,68,68,0.15)' }}
          whileTap={{ scale: 0.95 }}
        >
          <AlertTriangle className="w-4 h-4" />
          Hạ cánh Khẩn cấp
        </motion.button>
      </motion.div>

      {/* MAIN AREA: Map + Details */}
      <motion.div variants={itemVariants} className="flex gap-5" style={{ height: 520 }}>
        {/* LEFT — Tactical Map (65%) */}
        <div className="flex-[65] min-w-0">
          <TacticalMap selectedDrone={selectedDroneId} onSelectDrone={setSelectedDroneId} />
        </div>

        {/* RIGHT — Drone Details (35%) */}
        <div className="flex-[35] flex flex-col gap-4 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.05) transparent' }}>
          {/* Drone Selector */}
          <div>
            <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Signal className="w-3 h-3" /> Đội bay ({drones.length} đơn vị)
            </h3>
            <DroneSelector selected={selectedDroneId} onSelect={setSelectedDroneId} />
          </div>

          {/* Telemetry */}
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedDroneId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <TelemetryPanel drone={selectedDrone} />
            </motion.div>
          </AnimatePresence>

          {/* Control Panel */}
          <div>
            <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Điều khiển</h3>
            <ControlPanel />
          </div>
        </div>
      </motion.div>

      {/* BOTTOM — Mission Log */}
      <motion.div variants={itemVariants}>
        <MissionLog />
      </motion.div>
    </motion.div>
  );
}
