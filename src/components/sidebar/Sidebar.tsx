import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  MonitorPlay,
  ScanEye,
  ShieldAlert,
  BarChart3,
  Network,
  Settings,
  ChevronLeft,
  Hexagon,
} from 'lucide-react';
import { useUIStore } from '../../store';
import vi from '../../i18n/vi';

const menuItems = [
  { path: '/', icon: LayoutDashboard, label: vi.nav.dashboard },
  { path: '/monitoring', icon: MonitorPlay, label: vi.nav.liveMonitoring },
  { path: '/detection', icon: ScanEye, label: vi.nav.aiDetection },
  { path: '/violations', icon: ShieldAlert, label: vi.nav.violations },
  { path: '/analytics', icon: BarChart3, label: vi.nav.analytics },
  { path: '/architecture', icon: Network, label: vi.nav.architecture },
  { path: '/settings', icon: Settings, label: vi.nav.settings },
];

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const location = useLocation();

  return (
    <motion.aside
      className="fixed left-0 top-0 bottom-0 z-50 flex flex-col border-r border-white/[0.06] bg-surface-0/80 backdrop-blur-2xl"
      animate={{ width: sidebarCollapsed ? 72 : 240 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-4 border-b border-white/[0.06]">
        <div className="relative flex h-9 w-9 items-center justify-center flex-shrink-0">
          <Hexagon className="h-9 w-9 text-cyan-400" strokeWidth={1.5} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(0,212,255,0.6)]" />
          </div>
        </div>
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="text-sm font-bold tracking-wider text-white">{vi.app.name}</div>
              <div className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">{vi.app.subtitle}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className="group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200"
            >
              {/* Active background */}
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-xl bg-cyan-400/[0.08] border border-cyan-400/20"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}

              {/* Active indicator line */}
              {isActive && (
                <motion.div
                  layoutId="sidebar-indicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,212,255,0.6)]"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}

              <div className="relative z-10 flex items-center gap-3 w-full">
                <Icon
                  className={`h-[18px] w-[18px] flex-shrink-0 transition-colors duration-200 ${
                    isActive
                      ? 'text-cyan-400'
                      : 'text-slate-500 group-hover:text-slate-300'
                  }`}
                  strokeWidth={isActive ? 2 : 1.5}
                />

                <AnimatePresence>
                  {!sidebarCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.15 }}
                      className={`text-[13px] font-medium truncate ${
                        isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'
                      }`}
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              {/* Hover glow */}
              {!isActive && (
                <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity bg-white/[0.03]" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="border-t border-white/[0.06] p-3">
        <button
          onClick={toggleSidebar}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-2 text-slate-500 hover:text-slate-300 hover:bg-white/[0.03] transition-all"
        >
          <motion.div
            animate={{ rotate: sidebarCollapsed ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronLeft className="h-4 w-4" />
          </motion.div>
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs font-medium"
              >
                {vi.nav.collapse}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
}
