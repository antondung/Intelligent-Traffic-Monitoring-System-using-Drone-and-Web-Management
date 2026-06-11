/**
 * SENTINEL — useVideoUpload Hook
 * React hook for video file upload with drag & drop and progress tracking.
 */

import { useState, useCallback } from 'react';
import { uploadVideo } from '../services/api';
import { useTrafficStore } from '../store/trafficStore';

interface UseVideoUploadReturn {
  upload: (file: File) => Promise<void>;
  isUploading: boolean;
  progress: number;
  error: string | null;
  isDragOver: boolean;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  clearError: () => void;
}

const MAX_SIZE = 500 * 1024 * 1024; // 500MB

export function useVideoUpload(): UseVideoUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const { setSessionId, setProcessing } = useTrafficStore();

  const validateFile = (file: File): string | null => {
    // Check type
    const ext = file.name.split('.').pop()?.toLowerCase();
    const validExts = ['mp4', 'avi', 'mov', 'mkv', 'wmv'];
    if (!validExts.includes(ext || '')) {
      return `Invalid file type ".${ext}". Allowed: ${validExts.join(', ')}`;
    }

    // Check size
    if (file.size > MAX_SIZE) {
      return `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max: ${MAX_SIZE / 1024 / 1024}MB`;
    }

    return null;
  };

  const upload = useCallback(
    async (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setIsUploading(true);
      setProgress(0);
      setError(null);

      try {
        const response = await uploadVideo(file, (percent) => {
          setProgress(percent);
        });

        console.log('[Upload] Success:', response);
        setSessionId(response.session_id);
        setProcessing(true);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed';
        setError(message);
        console.error('[Upload] Failed:', err);
      } finally {
        setIsUploading(false);
      }
    },
    [setSessionId, setProcessing],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        upload(files[0]);
      }
    },
    [upload],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        upload(files[0]);
      }
    },
    [upload],
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    upload,
    isUploading,
    progress,
    error,
    isDragOver,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileSelect,
    clearError,
  };
}
