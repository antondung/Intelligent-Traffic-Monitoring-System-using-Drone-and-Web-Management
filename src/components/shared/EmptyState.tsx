/**
 * SENTINEL — EmptyState Component
 * Reusable zero-state UI for dashboard panels when no data is available.
 * Shown before video upload or when backend is idle.
 */

import React from 'react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  compact?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  compact = false,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`flex flex-col items-center justify-center text-center ${
        compact ? 'py-6 px-4' : 'py-12 px-6'
      }`}
    >
      {/* Icon with glow ring */}
      {icon && (
        <div className={`relative ${compact ? 'mb-3' : 'mb-5'}`}>
          <div className="absolute inset-0 rounded-full bg-cyan-400/5 blur-xl scale-150" />
          <div
            className={`relative ${
              compact ? 'w-10 h-10' : 'w-14 h-14'
            } rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-slate-500`}
          >
            {icon}
          </div>
        </div>
      )}

      {/* Title */}
      <h4
        className={`font-semibold text-slate-400 ${
          compact ? 'text-xs' : 'text-sm'
        } mb-1`}
      >
        {title}
      </h4>

      {/* Description */}
      {description && (
        <p
          className={`text-slate-600 max-w-xs leading-relaxed ${
            compact ? 'text-[10px]' : 'text-xs'
          }`}
        >
          {description}
        </p>
      )}

      {/* Action */}
      {action && <div className={compact ? 'mt-3' : 'mt-5'}>{action}</div>}
    </motion.div>
  );
};

export default EmptyState;
