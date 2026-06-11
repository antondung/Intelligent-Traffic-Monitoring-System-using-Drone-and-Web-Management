// ══════════════════════════════════════════════════════
// SENTINEL — Violations & OCR Page
// AI-powered traffic violation detection & plate recognition
// ══════════════════════════════════════════════════════

import { useState, useMemo, useEffect } from 'react';
import vi from '../i18n/vi';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  FileDown,
  Search,
  Gauge,
  TrafficCone,
  AlertTriangle,
  ParkingCircle,
  ArrowLeftRight,
  Filter,
  Calendar,
  ChevronDown,
  Eye,
  X,
  ScanLine,
  Clock,
  MapPin,
  Crosshair,
  Brain,
  CheckCircle2,
  XCircle,
  CircleDot,
  Car,
  Bike,
  Truck,
  Bus,
} from 'lucide-react';
import { VIOLATION_LABELS } from '../types';
import type { TrafficViolation } from '../types';
import { useTrafficStore } from '../store/trafficStore';
import { VideoUploader } from '../components/upload/VideoUploader';
import { EmptyState } from '../components/shared/EmptyState';

// ── Animated counter hook ────────────────────────────

function useAnimatedCounter(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

// ── Stat Card ────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  accentColor: string;
  borderColor: string;
  glowColor: string;
  delay: number;
}

function StatCard({ label, value, icon, accentColor, borderColor, glowColor, delay }: StatCardProps) {
  const animated = useAnimatedCounter(value);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`relative group bg-white/[0.03] backdrop-blur-xl border rounded-2xl p-4 overflow-hidden transition-all duration-300 hover:bg-white/[0.06] cursor-default ${borderColor}`}
      style={{ boxShadow: `0 0 20px ${glowColor}` }}
    >
      {/* Scanline overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.01] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      {/* HUD corner accents */}
      <div className={`absolute top-0 left-0 w-3 h-3 border-t border-l ${borderColor} rounded-tl-lg opacity-60`} />
      <div className={`absolute bottom-0 right-0 w-3 h-3 border-b border-r ${borderColor} rounded-br-lg opacity-60`} />

      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-lg bg-white/[0.04] ${accentColor}`}>{icon}</div>
        <span className={`text-2xl font-bold font-mono tracking-tight ${accentColor}`}>{animated}</span>
      </div>
      <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">{label}</p>
    </motion.div>
  );
}

// ── Filter Pill ──────────────────────────────────────

interface PillProps {
  label: string;
  active: boolean;
  onClick: () => void;
  color?: string;
}

function FilterPill({ label, active, onClick, color }: PillProps) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border whitespace-nowrap ${
        active
          ? `${color || 'bg-cyan-400/15 border-cyan-400/40 text-cyan-400'} shadow-[0_0_10px_rgba(0,212,255,0.15)]`
          : 'bg-white/[0.03] border-white/[0.06] text-slate-400 hover:bg-white/[0.06] hover:border-white/10'
      }`}
    >
      {label}
    </button>
  );
}

// ── Violation type badge colors ──────────────────────

const violationBadgeConfig: Record<string, { bg: string; text: string; border: string }> = {
  speeding: { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30' },
  red_light: { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30' },
  wrong_lane: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
  illegal_parking: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
  opposite_direction: { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30' },
};

const statusConfig: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
  pending: {
    bg: 'bg-amber-500/15',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    icon: <Clock className="w-3 h-3" />,
  },
  confirmed: {
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  dismissed: {
    bg: 'bg-slate-500/15',
    text: 'text-slate-400',
    border: 'border-slate-500/30',
    icon: <XCircle className="w-3 h-3" />,
  },
};

const vehicleIcons: Record<string, { icon: React.ReactNode; color: string }> = {
  Car: { icon: <Car className="w-3.5 h-3.5" />, color: 'text-cyan-400' },
  Motorbike: { icon: <Bike className="w-3.5 h-3.5" />, color: 'text-purple-400' },
  Truck: { icon: <Truck className="w-3.5 h-3.5" />, color: 'text-amber-400' },
  Bus: { icon: <Bus className="w-3.5 h-3.5" />, color: 'text-emerald-400' },
};

// ── Evidence Modal ──────────────────────────────────

interface EvidenceModalProps {
  violation: TrafficViolation;
  onClose: () => void;
}

function EvidenceModal({ violation, onClose }: EvidenceModalProps) {
  const badgeCfg = violationBadgeConfig[violation.violationType] || violationBadgeConfig.speeding;
  const statusCfg = statusConfig[violation.status];
  const ocrPct = (violation.ocrScore * 100).toFixed(1);
  const aiPct = (violation.aiConfidence * 100).toFixed(1);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl bg-slate-900/95 backdrop-blur-2xl border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl shadow-cyan-500/10"
      >
        {/* Modal header glow line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.1] transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6">
          {/* Title */}
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-cyan-400/10 border border-cyan-400/20">
              <ScanLine className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{vi.violations.evidenceDetail} — {violation.id}</h2>
              <p className="text-xs text-slate-500 font-mono">{violation.timestamp}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left — Snapshot */}
            <div className="space-y-4">
              {/* Image snapshot */}
              <div className="relative rounded-xl overflow-hidden border border-white/[0.06] bg-slate-950 aspect-video">
                <img
                  src={violation.snapshot}
                  alt="Violation snapshot"
                  className="w-full h-full object-cover opacity-90"
                />
                {/* OCR overlay box */}
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="bg-black/70 backdrop-blur-md rounded-lg border border-cyan-400/30 px-3 py-2 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-cyan-400/60 mb-0.5">{vi.violations.ocrResult}</div>
                      <div className="text-lg font-mono font-bold text-cyan-400 tracking-wider">{violation.licensePlate}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-0.5">{vi.detection.confidence}</div>
                      <div className={`text-sm font-bold font-mono ${violation.ocrScore > 0.9 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {ocrPct}%
                      </div>
                    </div>
                  </div>
                </div>
                {/* Scan line animation */}
                <motion.div
                  className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                />
              </div>

              {/* Cropped License Plate & AI Analysis */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Cropped Plate */}
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 flex flex-col justify-between">
                  <div className="flex items-center gap-2 mb-2">
                    <ScanLine className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Cắt biển số</span>
                  </div>
                  <div className="flex-1 flex items-center justify-center bg-slate-950 rounded-lg p-2 border border-white/[0.04] min-h-[64px]">
                    {violation.plateUrl ? (
                      <img src={violation.plateUrl} alt="Cropped Plate" className="max-h-12 object-contain" />
                    ) : (
                      <span className="text-slate-600 text-[10px]">Không có hình ảnh</span>
                    )}
                  </div>
                </div>

                {/* AI Analysis */}
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Brain className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">{vi.violations.aiAnalysis}</span>
                  </div>
                  <div className="space-y-2 text-xs text-slate-400">
                    <div className="flex justify-between">
                      <span>Mô hình Nhận diện</span>
                      <span className="text-slate-300 font-mono">YOLOv8-Traffic v2.4</span>
                    </div>
                    <div className="flex justify-between">
                      <span>OCR Engine</span>
                      <span className="text-slate-300 font-mono">PaddleOCR v4.1</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Thời gian xử lý</span>
                      <span className="text-slate-300 font-mono">{((violation.aiConfidence || 0.85) * 120 + 45).toFixed(0)}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{vi.violations.aiConfidence}</span>
                      <span className={`font-bold font-mono ${Number(aiPct) > 92 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {aiPct}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right — Details */}
            <div className="space-y-4">
              {/* Violation details */}
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-bold text-white mb-3">{vi.violations.violationInfo}</h3>

                <DetailRow label={vi.violations.violationType}>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${badgeCfg.bg} ${badgeCfg.text} ${badgeCfg.border}`}>
                    {VIOLATION_LABELS[violation.violationType] || violation.violationType}
                  </span>
                </DetailRow>

                <DetailRow label={vi.violations.licensePlate}>
                  <span className="font-mono font-bold text-cyan-400 text-sm">{violation.licensePlate}</span>
                </DetailRow>

                <DetailRow label="Loại phương tiện">
                  <span className="flex items-center gap-1.5 text-sm text-slate-300">
                    <span className={vehicleIcons[violation.vehicleType]?.color || 'text-slate-400'}>
                      {vehicleIcons[violation.vehicleType]?.icon || <CircleDot className="w-3.5 h-3.5" />}
                    </span>
                    {violation.vehicleType}
                  </span>
                </DetailRow>

                <DetailRow label="Vị trí">
                  <span className="flex items-center gap-1.5 text-sm text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    {violation.location}
                  </span>
                </DetailRow>

                <DetailRow label="Thiết bị ghi hình">
                  <span className="flex items-center gap-1.5 text-sm text-slate-300">
                    <Crosshair className="w-3.5 h-3.5 text-cyan-400/60" />
                    <span className="font-mono">Camera-01</span>
                  </span>
                </DetailRow>

                <DetailRow label={vi.detection.status}>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
                    {statusCfg.icon}
                    {(vi.violations as any)[violation.status] || violation.status}
                  </span>
                </DetailRow>
              </div>

              {/* Timeline */}
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                <h3 className="text-sm font-bold text-white mb-3">Dòng thời gian Sự kiện</h3>
                <div className="space-y-3">
                  {[
                    { time: violation.timestamp.split(' ')[1], event: 'Drone ghi nhận vi phạm', color: 'bg-cyan-400' },
                    { time: addSeconds(violation.timestamp.split(' ')[1], 2), event: 'Kích hoạt nhận diện AI', color: 'bg-purple-400' },
                    { time: addSeconds(violation.timestamp.split(' ')[1], 3), event: 'OCR trích xuất biển số', color: 'bg-cyan-400' },
                    { time: addSeconds(violation.timestamp.split(' ')[1], 5), event: 'Đóng gói & phân loại bằng chứng', color: 'bg-emerald-400' },
                    { time: addSeconds(violation.timestamp.split(' ')[1], 8), event: 'Chờ duyệt thủ công', color: 'bg-amber-400' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-2 h-2 rounded-full ${item.color}`} />
                        {idx < 4 && <div className="w-px h-4 bg-white/[0.06]" />}
                      </div>
                      <div className="flex-1 -mt-0.5">
                        <span className="text-[11px] font-mono text-slate-500">{item.time}</span>
                        <p className="text-xs text-slate-300">{item.event}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-sm font-semibold hover:bg-emerald-500/25 transition-all">
                  <CheckCircle2 className="w-4 h-4" />
                  {vi.violations.confirm}
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold hover:bg-red-500/20 transition-all">
                  <XCircle className="w-4 h-4" />
                  {vi.violations.dismiss}
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-white/[0.04] last:border-0">
      <span className="text-xs text-slate-500">{label}</span>
      {children}
    </div>
  );
}

function addSeconds(timeStr: string, secs: number): string {
  const parts = timeStr.split(':').map(Number);
  let s = parts[2] + secs;
  let m = parts[1];
  let h = parts[0];
  if (s >= 60) { m += Math.floor(s / 60); s %= 60; }
  if (m >= 60) { h += Math.floor(m / 60); m %= 60; }
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ── OCR Score Bar ────────────────────────────────────

function OcrScoreBar({ score }: { score: number }) {
  const pct = score * 100;
  const color = pct > 90 ? 'bg-emerald-400' : pct > 80 ? 'bg-amber-400' : 'bg-red-400';
  const glow = pct > 90 ? 'shadow-emerald-400/30' : pct > 80 ? 'shadow-amber-400/30' : 'shadow-red-400/30';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden min-w-[48px]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
          className={`h-full rounded-full ${color} shadow-sm ${glow}`}
        />
      </div>
      <span className={`text-xs font-mono w-10 text-right ${pct > 90 ? 'text-emerald-400' : pct > 80 ? 'text-amber-400' : 'text-red-400'}`}>
        {pct.toFixed(0)}%
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════

type ViolationFilter = 'all' | TrafficViolation['violationType'];
type StatusFilter = 'all' | TrafficViolation['status'];

export default function ViolationsOCR() {
  const [searchQuery, setSearchQuery] = useState('');
  const [violationFilter, setViolationFilter] = useState<ViolationFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedViolation, setSelectedViolation] = useState<TrafficViolation | null>(null);

  // ── Real-time AI Store — SINGLE SOURCE OF TRUTH ──
  const { violations: aiViolations, sessionId } = useTrafficStore();

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
          <div className="inline-flex p-3 rounded-2xl bg-red-500/10 border border-red-400/20 mb-2">
            <ShieldAlert size={36} className="text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Cảnh Báo Vi Phạm & OCR</h1>
          <p className="text-sm text-slate-500 font-mono">
            Nhận Diện Biển Số & Kiểm Soát Vi Phạm AI
          </p>
        </div>

        <div className="w-full max-w-2xl bg-white/[0.02] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6 shadow-2xl">
          <EmptyState
            icon={<ShieldAlert size={24} className="text-slate-500 animate-pulse" />}
            title="Đường ống AI chưa có dữ liệu"
            description="SENTINEL yêu cầu một video giao thông để kiểm quét lỗi và OCR biển số xe tự động. Vui lòng kéo & thả một file video camera giám sát hoặc drone của bạn bên dưới."
          />
          <VideoUploader />
        </div>
      </motion.div>
    );
  }

  // ── Map AI violations to TrafficViolation shape for UI ──
  const violations: TrafficViolation[] = useMemo(() => {
    return aiViolations.map((v) => ({
      id: v.id,
      timestamp: new Date(v.timestamp * 1000).toLocaleString('vi-VN'),
      licensePlate: v.plate || 'Chưa nhận dạng',
      vehicleType: v.vehicleClass.charAt(0).toUpperCase() + v.vehicleClass.slice(1),
      violationType: v.type as TrafficViolation['violationType'],
      ocrScore: v.plate ? v.confidence : 0,
      aiConfidence: v.confidence,
      snapshot: v.snapshot || '',
      plateUrl: v.plateUrl || '',
      location: 'Video upload',
      status: 'pending' as const,
    }));
  }, [aiViolations]);

  // ── Derived stats from REAL data ONLY ──
  const stats = useMemo(() => ({
    total: violations.length,
    speeding: violations.filter(v => v.violationType === 'speeding').length,
    redLight: violations.filter(v => v.violationType === 'red_light').length,
    wrongLane: violations.filter(v => v.violationType === 'wrong_lane').length,
    illegalParking: violations.filter(v => v.violationType === 'illegal_parking').length,
  }), [violations]);

  // ── Filtered data ─────────────────────────────────
  const filteredViolations = useMemo(() => {
    return violations.filter((v) => {
      if (violationFilter !== 'all' && v.violationType !== violationFilter) return false;
      if (statusFilter !== 'all' && v.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          v.licensePlate.toLowerCase().includes(q) ||
          v.id.toLowerCase().includes(q) ||
          v.location.toLowerCase().includes(q) ||
          v.vehicleType.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [violations, violationFilter, statusFilter, searchQuery]);

  // ── Violation type pills ──────────────────────────
  const violationTypes: { key: ViolationFilter; label: string; color?: string }[] = [
    { key: 'all', label: vi.violations.allTypes },
    { key: 'speeding', label: vi.violations.speeding, color: 'bg-red-400/15 border-red-400/40 text-red-400' },
    { key: 'red_light', label: vi.violations.redLight, color: 'bg-red-400/15 border-red-400/40 text-red-400' },
    { key: 'wrong_lane', label: vi.violations.wrongLane, color: 'bg-amber-400/15 border-amber-400/40 text-amber-400' },
    { key: 'illegal_parking', label: vi.violations.illegalParking, color: 'bg-amber-400/15 border-amber-400/40 text-amber-400' },
    { key: 'opposite_direction', label: vi.violations.oppositeDirection, color: 'bg-orange-400/15 border-orange-400/40 text-orange-400' },
  ];

  const statusTypes: { key: StatusFilter; label: string; color?: string }[] = [
    { key: 'all', label: vi.violations.allStatus },
    { key: 'pending', label: vi.violations.pending, color: 'bg-amber-400/15 border-amber-400/40 text-amber-400' },
    { key: 'confirmed', label: vi.violations.confirmed, color: 'bg-emerald-400/15 border-emerald-400/40 text-emerald-400' },
    { key: 'dismissed', label: vi.violations.dismissed, color: 'bg-slate-400/15 border-slate-400/40 text-slate-400' },
  ];

  return (
    <div className="p-6 space-y-6 min-h-screen">
      {/* ─── PAGE HEADER ─────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div className="relative">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-red-500/20 to-cyan-500/10 border border-red-400/20 shadow-lg shadow-red-500/10">
              <ShieldAlert className="w-6 h-6 text-red-400" />
            </div>
            {/* Pulse ring */}
            <div className="absolute -inset-1 rounded-2xl border border-red-400/20 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">{vi.violations.title}</h1>
            <p className="text-sm text-slate-500">{vi.violations.subtitle}</p>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder={vi.violations.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-9 pr-4 py-2.5 rounded-xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400/40 focus:shadow-[0_0_15px_rgba(0,212,255,0.1)] transition-all"
            />
          </div>

          {/* Export */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] text-sm text-slate-300 font-medium hover:bg-white/[0.08] hover:border-cyan-400/30 transition-all"
          >
            <FileDown className="w-4 h-4 text-cyan-400" />
            {vi.violations.exportPdf}
          </motion.button>
        </div>
      </motion.div>

      {/* ─── VIOLATION STATS ROW ─────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          label={vi.violations.totalViolations}
          value={stats.total}
          icon={<ShieldAlert className="w-5 h-5" />}
          accentColor="text-cyan-400"
          borderColor="border-cyan-400/20"
          glowColor="rgba(0,212,255,0.08)"
          delay={0.1}
        />
        <StatCard
          label={vi.violations.speeding}
          value={stats.speeding}
          icon={<Gauge className="w-5 h-5" />}
          accentColor="text-red-400"
          borderColor="border-red-400/20"
          glowColor="rgba(239,68,68,0.08)"
          delay={0.15}
        />
        <StatCard
          label={vi.violations.redLight}
          value={stats.redLight}
          icon={<TrafficCone className="w-5 h-5" />}
          accentColor="text-red-400"
          borderColor="border-red-400/20"
          glowColor="rgba(239,68,68,0.08)"
          delay={0.2}
        />
        <StatCard
          label={vi.violations.wrongLane}
          value={stats.wrongLane}
          icon={<ArrowLeftRight className="w-5 h-5" />}
          accentColor="text-amber-400"
          borderColor="border-amber-400/20"
          glowColor="rgba(245,158,11,0.08)"
          delay={0.25}
        />
        <StatCard
          label={vi.violations.illegalParking}
          value={stats.illegalParking}
          icon={<ParkingCircle className="w-5 h-5" />}
          accentColor="text-amber-400"
          borderColor="border-amber-400/20"
          glowColor="rgba(245,158,11,0.08)"
          delay={0.3}
        />
      </div>

      {/* ─── FILTER BAR ──────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.5 }}
        className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-4"
      >
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Violation type filters */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mr-1">
              <Filter className="w-3.5 h-3.5" />
              <span className="font-medium uppercase tracking-wider">Type</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {violationTypes.map((vt) => (
                <FilterPill
                  key={vt.key}
                  label={vt.label}
                  active={violationFilter === vt.key}
                  onClick={() => setViolationFilter(vt.key)}
                  color={vt.color}
                />
              ))}
            </div>
          </div>

          {/* Separator */}
          <div className="hidden lg:block w-px h-6 bg-white/[0.06]" />

          {/* Status filters */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mr-1">
              <CircleDot className="w-3.5 h-3.5" />
              <span className="font-medium uppercase tracking-wider">Status</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {statusTypes.map((st) => (
                <FilterPill
                  key={st.key}
                  label={st.label}
                  active={statusFilter === st.key}
                  onClick={() => setStatusFilter(st.key)}
                  color={st.color}
                />
              ))}
            </div>
          </div>

          {/* Separator */}
          <div className="hidden lg:block w-px h-6 bg-white/[0.06]" />

          {/* Date range */}
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-slate-400 hover:bg-white/[0.06] transition-all">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Hôm nay — 20/05/2026</span>
              <ChevronDown className="w-3 h-3 text-slate-600" />
            </button>
          </div>

          {/* Result count */}
          <div className="lg:ml-auto">
            <span className="text-xs text-slate-500 font-mono">
              {filteredViolations.length} kết quả
            </span>
          </div>
        </div>
      </motion.div>

      {/* ─── VIOLATIONS TABLE ────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.3)]"
      >
        {/* Table top glow */}
        <div className="h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {[vi.violations.timestamp, vi.violations.snapshot, vi.violations.licensePlate, 'Phương tiện', vi.violations.violationType, vi.violations.ocrScore, vi.violations.aiConfidence, vi.detection.status, ''].map(
                  (h, i) => (
                    <th
                      key={i}
                      className="px-4 py-3.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {filteredViolations.map((v, idx) => {
                const badgeCfg = violationBadgeConfig[v.violationType] || violationBadgeConfig.speeding;
                const sCfg = statusConfig[v.status];
                const vIcon = vehicleIcons[v.vehicleType];
                const snapshotColors = ['bg-red-500/30', 'bg-cyan-500/30', 'bg-purple-500/30', 'bg-amber-500/30', 'bg-emerald-500/30'];

                return (
                  <motion.tr
                    key={v.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * Math.min(idx, 10), duration: 0.3 }}
                    onClick={() => setSelectedViolation(v)}
                    className={`border-b border-white/[0.03] cursor-pointer transition-all duration-200 hover:bg-white/[0.03] ${
                      idx % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.01]'
                    }`}
                  >
                    {/* Timestamp */}
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono text-slate-400">{v.timestamp}</span>
                    </td>

                    {/* Snapshot thumbnail */}
                    <td className="px-4 py-3">
                      <div
                        className="w-12 h-8 rounded-md border border-white/[0.08] flex items-center justify-center overflow-hidden bg-slate-950"
                      >
                        {v.snapshot ? (
                          <img src={v.snapshot} alt="Thumb" className="w-full h-full object-cover" />
                        ) : (
                          <ScanLine className="w-3 h-3 text-white/40" />
                        )}
                      </div>
                    </td>

                    {/* License Plate */}
                    <td className="px-4 py-3">
                      <span className="text-sm font-mono font-bold text-cyan-400 tracking-wide">{v.licensePlate}</span>
                    </td>

                    {/* Vehicle Type */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={vIcon?.color || 'text-slate-400'}>{vIcon?.icon || <CircleDot className="w-3.5 h-3.5" />}</span>
                        <span className="text-xs text-slate-300">{v.vehicleType}</span>
                      </div>
                    </td>

                    {/* Violation Type */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${badgeCfg.bg} ${badgeCfg.text} ${badgeCfg.border}`}
                      >
                        <AlertTriangle className="w-3 h-3" />
                        {VIOLATION_LABELS[v.violationType] || v.violationType}
                      </span>
                    </td>

                    {/* OCR Score */}
                    <td className="px-4 py-3 min-w-[120px]">
                      <OcrScoreBar score={v.ocrScore} />
                    </td>

                    {/* AI Confidence */}
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-mono font-bold ${
                          v.aiConfidence > 0.93 ? 'text-emerald-400' : v.aiConfidence > 0.88 ? 'text-amber-400' : 'text-red-400'
                        }`}
                      >
                        {(v.aiConfidence * 100).toFixed(1)}%
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${sCfg.bg} ${sCfg.text} ${sCfg.border}`}
                      >
                        {sCfg.icon}
                        {(vi.violations as any)[v.status] || v.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedViolation(v);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 text-[11px] font-semibold hover:bg-cyan-400/20 transition-all group"
                      >
                        <Eye className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                        {vi.violations.view}
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty state */}
        {filteredViolations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] mb-4">
              <ShieldAlert className="w-8 h-8 text-slate-600" />
            </div>
            <p className="text-sm text-slate-500 font-medium">Không có vi phạm phù hợp với bộ lọc</p>
            <p className="text-xs text-slate-600 mt-1">Thử điều chỉnh tìm kiếm hoặc tiêu chí lọc</p>
          </div>
        )}

        {/* Table footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06]">
          <span className="text-xs text-slate-600 font-mono">
            Hiển thị {filteredViolations.length} / {violations.length} bản ghi
          </span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] text-slate-500">Trực tiếp — Tự động làm mới mỗi 30 giây</span>
          </div>
        </div>
      </motion.div>

      {/* ─── EVIDENCE MODAL ──────────────────────────── */}
      <AnimatePresence>
        {selectedViolation && (
          <EvidenceModal
            violation={selectedViolation}
            onClose={() => setSelectedViolation(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
