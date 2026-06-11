import { useState } from 'react';
import vi from '../i18n/vi';
import { motion } from 'framer-motion';
import {
  Settings as SettingsIcon,
  Brain,
  Bell,
  Key,
  Info,
  Eye,
  EyeOff,
  RefreshCw,
  Save,
  ChevronDown,
  Shield,
} from 'lucide-react';

// ─── Toggle Switch ───────────────────────────────────────────────────────────
interface ToggleSwitchProps {
  enabled: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

const ToggleSwitch = ({ enabled, onToggle, disabled = false }: ToggleSwitchProps) => (
  <button
    onClick={disabled ? undefined : onToggle}
    className={`relative w-12 h-6 rounded-full transition-all duration-300 flex-shrink-0 ${
      disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
    } ${
      enabled
        ? 'bg-cyan-500/30 border border-cyan-400/50 shadow-[0_0_10px_rgba(0,212,255,0.25)]'
        : 'bg-white/5 border border-white/10'
    }`}
  >
    <motion.div
      animate={{ x: enabled ? 24 : 2 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={`absolute top-1 w-4 h-4 rounded-full transition-colors duration-300 ${
        enabled ? 'bg-cyan-400 shadow-[0_0_8px_rgba(0,212,255,0.5)]' : 'bg-slate-500'
      }`}
    />
  </button>
);

// ─── Glass Input ─────────────────────────────────────────────────────────────
interface GlassInputProps {
  value: string;
  onChange: (val: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
}

const GlassInput = ({ value, onChange, type = 'text', placeholder, disabled }: GlassInputProps) => (
  <input
    type={type}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    disabled={disabled}
    className="w-full sm:w-64 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white
      placeholder:text-slate-600 outline-none transition-all duration-300
      focus:border-cyan-400/40 focus:shadow-[0_0_12px_rgba(0,212,255,0.1)]
      disabled:opacity-50 disabled:cursor-not-allowed"
  />
);

// ─── Glass Select ────────────────────────────────────────────────────────────
interface GlassSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: string[];
}

const GlassSelect = ({ value, onChange, options }: GlassSelectProps) => (
  <div className="relative w-full sm:w-64">
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full appearance-none bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white
        outline-none transition-all duration-300 cursor-pointer
        focus:border-cyan-400/40 focus:shadow-[0_0_12px_rgba(0,212,255,0.1)]"
    >
      {options.map((opt) => (
        <option key={opt} value={opt} className="bg-slate-900 text-white">
          {opt}
        </option>
      ))}
    </select>
    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
  </div>
);

// ─── Setting Row ─────────────────────────────────────────────────────────────
interface SettingRowProps {
  label: string;
  description?: string;
  children: React.ReactNode;
}

const SettingRow = ({ label, description, children }: SettingRowProps) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 py-3.5 border-b border-white/[0.04] last:border-0">
    <div className="flex-1 min-w-0">
      <p className="text-sm text-slate-200">{label}</p>
      {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
    </div>
    <div className="flex items-center">{children}</div>
  </div>
);

// ─── Section Card ────────────────────────────────────────────────────────────
interface SectionCardProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  index: number;
}

const SectionCard = ({ icon, title, children, index }: SectionCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: 0.15 + index * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
    className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl overflow-hidden
      hover:border-white/[0.1] transition-all duration-500"
  >
    {/* Section Header */}
    <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
      <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center">
        {icon}
      </div>
      <h2 className="text-sm font-semibold text-white tracking-wide uppercase">{title}</h2>
    </div>
    {/* Section Content */}
    <div className="px-5 py-2">{children}</div>
  </motion.div>
);

// ─── Slider Component ────────────────────────────────────────────────────────
interface SliderProps {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (val: number) => void;
}

const GlassSlider = ({ value, min, max, step, onChange }: SliderProps) => {
  const percent = ((value - min) / (max - min)) * 100;
  return (
    <div className="flex items-center gap-3 w-full sm:w-64">
      <div className="relative flex-1 h-6 flex items-center">
        <div className="absolute w-full h-1.5 rounded-full bg-white/5 border border-white/10" />
        <div
          className="absolute h-1.5 rounded-full bg-gradient-to-r from-cyan-500/60 to-cyan-400/80"
          style={{ width: `${percent}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute w-full h-6 opacity-0 cursor-pointer z-10"
        />
        <div
          className="absolute w-4 h-4 rounded-full bg-cyan-400 border-2 border-cyan-300 shadow-[0_0_10px_rgba(0,212,255,0.5)] pointer-events-none"
          style={{ left: `calc(${percent}% - 8px)` }}
        />
      </div>
      <span className="text-sm text-cyan-400 font-mono w-10 text-right">{value.toFixed(2)}</span>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// MAIN SETTINGS PAGE
// ═════════════════════════════════════════════════════════════════════════════
const Settings = () => {
  // ── General State ────────────────────────────────────────────────────────
  const [systemName, setSystemName] = useState('SENTINEL');
  const [language, setLanguage] = useState('Vietnamese');
  const [timezone, setTimezone] = useState('Asia/Ho_Chi_Minh');
  const [darkMode] = useState(true);

  // ── AI Configuration State ───────────────────────────────────────────────
  const [detectionModel, setDetectionModel] = useState('YOLOv8n');
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.85);
  const [maxTrackAge, setMaxTrackAge] = useState('30');
  const [ocrEngine, setOcrEngine] = useState('EasyOCR');
  const [autoDetectViolations, setAutoDetectViolations] = useState(true);

  // ── Notifications State ──────────────────────────────────────────────────
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(false);
  const [criticalViolationAlerts, setCriticalViolationAlerts] = useState(true);
  const [droneBatteryAlerts, setDroneBatteryAlerts] = useState(true);

  // ── API State ────────────────────────────────────────────────────────────
  const [showApiKey, setShowApiKey] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('https://api.sentinel.io/webhooks/v1');
  const apiKeyFull = 'sk-sentinel-a8f2e9c1d4b7f3a6e8c2d5b9f1a4e7c3';
  const apiKeyMasked = 'sk-sentinel-xxxx••••••••••••••••xxxx';

  // ── System Info Data ─────────────────────────────────────────────────────
  const systemInfo = [
    { label: vi.settings.version, value: 'SENTINEL v2.4.0' },
    { label: vi.architecture.frontend, value: 'React 19 + Vite 6' },
    { label: vi.architecture.aiEngineLabel, value: 'YOLOv8 v8.2 + ByteTrack + EasyOCR' },
    { label: vi.architecture.databaseLabel, value: 'PostgreSQL 16 + Redis 7' },
    { label: vi.settings.lastUpdated, value: '2026-05-20' },
    { label: 'Hoạt động', value: '72h 34m' },
  ];

  // ── Save handler ─────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);
  const handleSave = () => {
    setSaving(true);
    setTimeout(() => setSaving(false), 1500);
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 space-y-6">
      {/* ═══ HEADER ═══════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="flex items-center gap-4"
      >
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-400/20
          flex items-center justify-center shadow-[0_0_20px_rgba(0,212,255,0.15)]"
        >
          <SettingsIcon className="w-6 h-6 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{vi.settings.title}</h1>
          <p className="text-sm text-slate-500">{vi.settings.subtitle}</p>
        </div>
      </motion.div>

      {/* ═══ SECTIONS ═════════════════════════════════════════════════════ */}
      <div className="max-w-3xl space-y-5">
        {/* ── Section 1: General ──────────────────────────────────────── */}
        <SectionCard
          icon={<SettingsIcon className="w-4 h-4 text-cyan-400" />}
          title={vi.settings.general}
          index={0}
        >
          <SettingRow label={vi.settings.systemName} description={vi.settings.systemNameDesc}>
            <GlassInput value={systemName} onChange={setSystemName} />
          </SettingRow>
          <SettingRow label={vi.settings.language}>
            <GlassSelect value={language} onChange={setLanguage} options={['Vietnamese', 'English']} />
          </SettingRow>
          <SettingRow label={vi.settings.timezone}>
            <GlassSelect
              value={timezone}
              onChange={setTimezone}
              options={['Asia/Ho_Chi_Minh', 'Asia/Bangkok', 'UTC', 'America/New_York', 'Europe/London']}
            />
          </SettingRow>
          <SettingRow label={vi.settings.darkMode} description={vi.settings.darkModeDesc}>
            <div className="flex items-center gap-2">
              <ToggleSwitch enabled={darkMode} onToggle={() => {}} disabled />
              <span className="text-xs text-slate-600 font-mono">{vi.settings.locked}</span>
            </div>
          </SettingRow>
        </SectionCard>

        {/* ── Section 2: AI Configuration ─────────────────────────────── */}
        <SectionCard
          icon={<Brain className="w-4 h-4 text-cyan-400" />}
          title={vi.settings.aiConfig}
          index={1}
        >
          <SettingRow label={vi.settings.detectionModel} description={vi.settings.detectionModelDesc}>
            <GlassSelect
              value={detectionModel}
              onChange={setDetectionModel}
              options={['YOLOv8n', 'YOLOv8s', 'YOLOv8m', 'YOLOv8l']}
            />
          </SettingRow>
          <SettingRow label={vi.settings.confidenceThreshold} description={vi.settings.confidenceThresholdDesc}>
            <GlassSlider
              value={confidenceThreshold}
              min={0.5}
              max={1.0}
              step={0.01}
              onChange={setConfidenceThreshold}
            />
          </SettingRow>
          <SettingRow label={vi.settings.maxTrackAge} description={vi.settings.maxTrackAgeDesc}>
            <GlassInput value={maxTrackAge} onChange={setMaxTrackAge} type="number" />
          </SettingRow>
          <SettingRow label={vi.settings.ocrEngine} description={vi.settings.ocrEngineDesc}>
            <GlassSelect
              value={ocrEngine}
              onChange={setOcrEngine}
              options={['EasyOCR', 'PaddleOCR', 'Tesseract']}
            />
          </SettingRow>
          <SettingRow label={vi.settings.autoDetectViolations} description={vi.settings.autoDetectViolationsDesc}>
            <ToggleSwitch enabled={autoDetectViolations} onToggle={() => setAutoDetectViolations(!autoDetectViolations)} />
          </SettingRow>
        </SectionCard>

        {/* ── Section 3: Notifications ────────────────────────────────── */}
        <SectionCard
          icon={<Bell className="w-4 h-4 text-cyan-400" />}
          title={vi.settings.notifications}
          index={2}
        >
          <SettingRow label={vi.settings.pushNotifications} description={vi.settings.pushNotificationsDesc}>
            <ToggleSwitch enabled={pushNotifications} onToggle={() => setPushNotifications(!pushNotifications)} />
          </SettingRow>
          <SettingRow label={vi.settings.emailAlerts} description={vi.settings.emailAlertsDesc}>
            <ToggleSwitch enabled={emailAlerts} onToggle={() => setEmailAlerts(!emailAlerts)} />
          </SettingRow>
          <SettingRow label={vi.settings.soundAlerts} description={vi.settings.soundAlertsDesc}>
            <ToggleSwitch enabled={soundAlerts} onToggle={() => setSoundAlerts(!soundAlerts)} />
          </SettingRow>
          <SettingRow label={vi.settings.criticalViolationAlerts} description={vi.settings.criticalViolationAlertsDesc}>
            <ToggleSwitch enabled={criticalViolationAlerts} onToggle={() => setCriticalViolationAlerts(!criticalViolationAlerts)} />
          </SettingRow>
          <SettingRow label={vi.settings.droneBatteryAlerts} description={vi.settings.droneBatteryAlertsDesc}>
            <ToggleSwitch enabled={droneBatteryAlerts} onToggle={() => setDroneBatteryAlerts(!droneBatteryAlerts)} />
          </SettingRow>
        </SectionCard>

        {/* ── Section 4: API & Integration ─────────────────────────────── */}
        <SectionCard
          icon={<Key className="w-4 h-4 text-cyan-400" />}
          title={vi.settings.apiIntegration}
          index={3}
        >
          <SettingRow label={vi.settings.apiKey} description={vi.settings.apiKeyDesc}>
            <div className="flex items-center gap-2">
              <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 font-mono text-xs text-slate-300
                w-full sm:w-64 truncate select-all"
              >
                {showApiKey ? apiKeyFull : apiKeyMasked}
              </div>
              <button
                onClick={() => setShowApiKey(!showApiKey)}
                className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-cyan-400
                  hover:border-cyan-400/30 transition-all duration-300"
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </SettingRow>
          <SettingRow label={vi.settings.webhookUrl} description={vi.settings.webhookUrlDesc}>
            <GlassInput value={webhookUrl} onChange={setWebhookUrl} />
          </SettingRow>
          <SettingRow label={vi.settings.rateLimit} description={vi.settings.rateLimitDesc}>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-emerald-400 font-mono">1000 req/min</span>
            </div>
          </SettingRow>
          <SettingRow label={vi.settings.regenerateKey} description={vi.settings.regenerateKeyDesc}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20
                text-red-400 text-sm font-medium hover:bg-red-500/20 hover:border-red-500/30
                transition-all duration-300"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {vi.settings.regenerateKey}
            </motion.button>
          </SettingRow>
        </SectionCard>

        {/* ── Section 5: System Info ───────────────────────────────────── */}
        <SectionCard
          icon={<Info className="w-4 h-4 text-cyan-400" />}
          title={vi.settings.systemInfo}
          index={4}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
            {systemInfo.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between py-3.5 border-b border-white/[0.04] last:border-0"
              >
                <span className="text-sm text-slate-500">{item.label}</span>
                <span className="text-sm text-slate-200 font-mono">{item.value}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* ═══ SAVE BUTTON ════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <motion.button
            onClick={handleSave}
            whileHover={{ scale: 1.005 }}
            whileTap={{ scale: 0.995 }}
            disabled={saving}
            className={`w-full py-3.5 rounded-xl font-semibold text-sm tracking-wide uppercase
              flex items-center justify-center gap-2 transition-all duration-500
              ${
                saving
                  ? 'bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 cursor-wait'
                  : 'bg-gradient-to-r from-cyan-500/20 to-cyan-400/10 border border-cyan-400/30 text-cyan-400 hover:from-cyan-500/30 hover:to-cyan-400/20 hover:border-cyan-400/50 shadow-[0_0_20px_rgba(0,212,255,0.12)] hover:shadow-[0_0_30px_rgba(0,212,255,0.2)]'
              }`}
          >
            {saving ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <RefreshCw className="w-4 h-4" />
                </motion.div>
                {vi.settings.saving}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {vi.settings.save}
              </>
            )}
          </motion.button>
        </motion.div>
      </div>

      {/* Subtle bottom padding */}
      <div className="h-8" />
    </div>
  );
};

export default Settings;
