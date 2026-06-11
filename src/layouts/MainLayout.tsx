import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from '../components/sidebar/Sidebar';
import Header from '../components/header/Header';
import { useUIStore } from '../store';

export default function MainLayout() {
  const { sidebarCollapsed } = useUIStore();

  return (
    <div className="h-screen w-screen overflow-hidden bg-surface-0 relative">
      {/* Ambient Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-grid opacity-40" />

        {/* Radial gradient glow */}
        <div className="absolute inset-0 bg-gradient-mesh" />

        {/* Top accent gradient */}
        <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-cyan-500/[0.03] to-transparent" />

        {/* Subtle scan line */}
        <div className="absolute inset-0 opacity-20 scan-lines" />
      </div>

      {/* Sidebar */}
      <Sidebar />

      {/* Main Area */}
      <motion.div
        className="h-screen flex flex-col relative z-10"
        animate={{
          marginLeft: sidebarCollapsed ? 72 : 240,
        }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        <Header />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="p-6"
          >
            <Outlet />
          </motion.div>
        </main>
      </motion.div>
    </div>
  );
}
