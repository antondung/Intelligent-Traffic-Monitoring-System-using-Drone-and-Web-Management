/**
 * SENTINEL — VideoUploader Component
 * Premium drag & drop video upload UI with progress tracking.
 */

import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoUpload } from '../../hooks/useVideoUpload';

export const VideoUploader: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    isUploading,
    progress,
    error,
    isDragOver,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileSelect,
    clearError,
  } = useVideoUpload();

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        style={{
          width: '100%',
          maxWidth: '600px',
          padding: '2rem',
        }}
      >
        {/* Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            position: 'relative',
            border: `2px dashed ${isDragOver ? '#00f0ff' : 'rgba(0, 240, 255, 0.3)'}`,
            borderRadius: '16px',
            padding: '3rem 2rem',
            textAlign: 'center',
            cursor: isUploading ? 'default' : 'pointer',
            background: isDragOver
              ? 'rgba(0, 240, 255, 0.08)'
              : 'rgba(10, 15, 30, 0.6)',
            backdropFilter: 'blur(20px)',
            transition: 'all 0.3s ease',
            overflow: 'hidden',
          }}
        >
          {/* Animated border glow */}
          <div
            style={{
              position: 'absolute',
              inset: '-1px',
              borderRadius: '16px',
              background: isDragOver
                ? 'linear-gradient(135deg, rgba(0,240,255,0.2), rgba(120,80,255,0.2))'
                : 'transparent',
              transition: 'all 0.3s ease',
              pointerEvents: 'none',
            }}
          />

          {/* Icon */}
          <motion.div
            animate={isDragOver ? { scale: 1.1, y: -5 } : { scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300 }}
            style={{ marginBottom: '1rem' }}
          >
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke={isDragOver ? '#00f0ff' : 'rgba(0, 240, 255, 0.5)'}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ margin: '0 auto', display: 'block' }}
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </motion.div>

          {/* Text */}
          {!isUploading ? (
            <>
              <h3
                style={{
                  color: '#e0e8ff',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  marginBottom: '0.5rem',
                }}
              >
                {isDragOver ? 'Thả video tại đây' : 'Tải lên video giao thông'}
              </h3>
              <p
                style={{
                  color: 'rgba(160, 180, 220, 0.7)',
                  fontSize: '0.85rem',
                  marginBottom: '1rem',
                }}
              >
                Kéo & thả hoặc nhấp để chọn file • MP4, AVI, MOV • Tối đa 500MB
              </p>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 16px',
                  borderRadius: '20px',
                  background: 'rgba(0, 240, 255, 0.1)',
                  border: '1px solid rgba(0, 240, 255, 0.2)',
                  color: '#00f0ff',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polygon points="10 8 16 12 10 16 10 8" />
                </svg>
                Mô phỏng Drone — Upload video để bắt đầu AI phân tích
              </div>
            </>
          ) : (
            <>
              <h3
                style={{
                  color: '#e0e8ff',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  marginBottom: '1rem',
                }}
              >
                Đang tải lên... {progress}%
              </h3>
              {/* Progress bar */}
              <div
                style={{
                  width: '100%',
                  height: '6px',
                  borderRadius: '3px',
                  background: 'rgba(0, 240, 255, 0.1)',
                  overflow: 'hidden',
                }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                  style={{
                    height: '100%',
                    borderRadius: '3px',
                    background: 'linear-gradient(90deg, #00f0ff, #7850ff)',
                    boxShadow: '0 0 10px rgba(0, 240, 255, 0.5)',
                  }}
                />
              </div>
            </>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/avi,video/quicktime,.mp4,.avi,.mov,.mkv,.wmv"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{
                marginTop: '1rem',
                padding: '12px 16px',
                borderRadius: '8px',
                background: 'rgba(255, 50, 50, 0.1)',
                border: '1px solid rgba(255, 50, 50, 0.3)',
                color: '#ff6b6b',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>{error}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearError();
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ff6b6b',
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  padding: '0 4px',
                }}
              >
                ×
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
