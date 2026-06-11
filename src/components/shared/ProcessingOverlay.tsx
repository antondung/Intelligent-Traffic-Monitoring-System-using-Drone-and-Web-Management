/**
 * SENTINEL — ProcessingOverlay Component
 * Shows real-time processing progress during video inference.
 * Displays: progress bar, FPS, frame counter, elapsed time.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, Activity, Clock, Film } from 'lucide-react';
import { useTrafficStore } from '../../store/trafficStore';

export const ProcessingOverlay: React.FC = () => {
  const {
    fps,
    processingProgress,
    currentFrame,
    totalFrames,
    isProcessing,
    processingComplete,
    processingDuration,
    averageFps,
  } = useTrafficStore();

  if (!isProcessing && !processingComplete) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4"
    >
      {isProcessing ? (
        <>
          {/* Progress bar */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <div className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
              </div>
              <span className="text-xs font-semibold text-white">Đang xử lý AI</span>
            </div>
            <span className="text-xs font-mono text-cyan-400">
              {processingProgress.toFixed(1)}%
            </span>
          </div>

          {/* Progress bar track */}
          <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden mb-3">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-purple-500"
              style={{ width: `${processingProgress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Metrics row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-emerald-400" />
              <div>
                <div className="text-[9px] font-mono uppercase text-slate-600">FPS</div>
                <div className="text-xs font-mono font-semibold text-white">{fps.toFixed(1)}</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Film className="w-3 h-3 text-purple-400" />
              <div>
                <div className="text-[9px] font-mono uppercase text-slate-600">Frame</div>
                <div className="text-xs font-mono font-semibold text-white">
                  {currentFrame.toLocaleString()}/{totalFrames.toLocaleString()}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-amber-400" />
              <div>
                <div className="text-[9px] font-mono uppercase text-slate-600">ETA</div>
                <div className="text-xs font-mono font-semibold text-white">
                  {fps > 0 && totalFrames > currentFrame
                    ? `${Math.ceil((totalFrames - currentFrame) / fps)}s`
                    : '—'}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : processingComplete ? (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-400/10 flex items-center justify-center">
            <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-emerald-400">Xử lý hoàn tất</div>
            <div className="text-[10px] font-mono text-slate-500">
              {processingDuration > 0 && `${processingDuration.toFixed(1)}s`}
              {averageFps > 0 && ` • ${averageFps.toFixed(1)} FPS trung bình`}
            </div>
          </div>
        </div>
      ) : null}
    </motion.div>
  );
};

export default ProcessingOverlay;
