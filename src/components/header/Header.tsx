import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Cpu,
  Gauge,
  CloudSun,
  Activity,
  User,
  ChevronDown,
  LogOut,
  Settings,
  Check,
} from 'lucide-react';
import { useClock } from '../../hooks';
import { useAlertStore, useAuthStore } from '../../store';
import { useTrafficStore } from '../../store/trafficStore';
import vi from '../../i18n/vi';

export default function Header() {
  const time = useClock();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const { alerts, unreadCount, markAsRead, markAllRead } = useAlertStore();
  const { user, logout } = useAuthStore();

  const backendOnline = useTrafficStore((state) => state.backendOnline);
  const isProcessing = useTrafficStore((state) => state.isProcessing);
  const fps = useTrafficStore((state) => state.fps);

  const gpuUsage = isProcessing ? '78%' : '0%';
  const latency = !backendOnline ? '---' : (isProcessing && fps > 0 ? `${Math.round(1000 / fps)}ms` : '1ms');

  const timeParts = time.split(':');

  return (
    <header className="h-14 border-b border-white/[0.06] bg-surface-0/60 backdrop-blur-2xl flex items-center justify-between px-5 relative z-40">
      {/* Left — System Status Indicators */}
      <div className="flex items-center gap-6">
        {/* AI Engine */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Cpu className={`h-4 w-4 ${backendOnline ? 'text-emerald-400' : 'text-red-400'}`} />
            {backendOnline && <div className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />}
          </div>
          <div className="hidden lg:block">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500">{vi.header.aiEngine}</div>
            <div className={`text-xs font-semibold ${backendOnline ? 'text-emerald-400' : 'text-red-400'}`}>
              {backendOnline ? vi.header.online : vi.header.offline}
            </div>
          </div>
        </div>

        {/* Separator */}
        <div className="h-6 w-px bg-white/[0.06]" />

        {/* GPU */}
        <div className="flex items-center gap-2">
          <Gauge className="h-4 w-4 text-purple-400" />
          <div className="hidden lg:block">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500">GPU</div>
            <div className="text-xs font-semibold text-white">{gpuUsage}</div>
          </div>
        </div>

        <div className="h-6 w-px bg-white/[0.06] hidden xl:block" />

        {/* Weather */}
        <div className="items-center gap-2 hidden xl:flex">
          <CloudSun className="h-4 w-4 text-amber-400" />
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500">{vi.header.weather}</div>
            <div className="text-xs font-semibold text-white">{vi.header.partlyCloudy}</div>
          </div>
        </div>

        <div className="h-6 w-px bg-white/[0.06] hidden xl:block" />

        {/* Latency */}
        <div className="items-center gap-2 hidden xl:flex">
          <Activity className="h-4 w-4 text-emerald-400" />
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500">{vi.header.latency}</div>
            <div className="text-xs font-semibold text-emerald-400">{latency}</div>
          </div>
        </div>
      </div>

      {/* Right — Clock, Notifications, Profile */}
      <div className="flex items-center gap-4">
        {/* Clock */}
        <div className="font-mono text-sm tracking-wider text-slate-300 tabular-nums hidden sm:block">
          <span>{timeParts[0]}</span>
          <span className="animate-blink text-cyan-400">:</span>
          <span>{timeParts[1]}</span>
          <span className="animate-blink text-cyan-400">:</span>
          <span className="text-slate-500">{timeParts[2]}</span>
        </div>

        <div className="h-6 w-px bg-white/[0.06]" />

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfile(false);
            }}
            className="relative p-2 rounded-lg hover:bg-white/[0.05] transition-colors"
          >
            <Bell className="h-4 w-4 text-slate-400" />
            {unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold flex items-center justify-center text-white shadow-[0_0_8px_rgba(239,68,68,0.5)]"
              >
                {unreadCount}
              </motion.div>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-white/[0.08] bg-slate-900/95 backdrop-blur-2xl shadow-2xl overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                  <span className="text-sm font-semibold text-white">{vi.header.notifications}</span>
                  <button
                    onClick={markAllRead}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium"
                  >
                    {vi.header.markAllRead}
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {alerts.map((alert) => (
                    <button
                      key={alert.id}
                      onClick={() => markAsRead(alert.id)}
                      className={`w-full text-left px-4 py-3 border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors ${
                        !alert.read ? 'bg-white/[0.02]' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${
                          alert.type === 'critical' ? 'bg-red-400' :
                          alert.type === 'warning' ? 'bg-amber-400' : 'bg-cyan-400'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-white truncate">{alert.title}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{alert.message}</div>
                          <div className="text-[10px] text-slate-500 mt-1 font-mono">{alert.timestamp}</div>
                        </div>
                        {alert.read && <Check className="h-3 w-3 text-slate-600 flex-shrink-0 mt-1" />}
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfile(!showProfile);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white/[0.05] transition-colors"
          >
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center">
              <User className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="hidden md:block text-left">
              <div className="text-xs font-semibold text-white">{user?.name}</div>
              <div className="text-[10px] text-slate-500">{user?.role}</div>
            </div>
            <ChevronDown className="h-3 w-3 text-slate-500 hidden md:block" />
          </button>

          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-white/[0.08] bg-slate-900/95 backdrop-blur-2xl shadow-2xl overflow-hidden"
              >
                <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-white/[0.05] hover:text-white transition-colors">
                  <Settings className="h-4 w-4" />
                  {vi.header.settings}
                </button>
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-400/[0.08] transition-colors border-t border-white/[0.06]"
                >
                  <LogOut className="h-4 w-4" />
                  {vi.header.signOut}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Click-away handler */}
      {(showNotifications || showProfile) && (
        <div
          className="fixed inset-0 z-[-1]"
          onClick={() => {
            setShowNotifications(false);
            setShowProfile(false);
          }}
        />
      )}
    </header>
  );
}
