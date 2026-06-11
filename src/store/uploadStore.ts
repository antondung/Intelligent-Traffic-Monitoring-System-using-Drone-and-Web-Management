import { StateCreator } from 'zustand';

export interface UploadSlice {
  sessionId: string | null;
  uploadProgress: number;
  isUploading: boolean;
  uploadError: string | null;
  setSessionId: (sessionId: string | null) => void;
  setUploadProgress: (progress: number) => void;
  setUploading: (uploading: boolean) => void;
  setUploadError: (error: string | null) => void;
  resetUpload: () => void;
}

export const createUploadSlice: StateCreator<UploadSlice, [], [], UploadSlice> = (set) => ({
  sessionId: null,
  uploadProgress: 0,
  isUploading: false,
  uploadError: null,

  setSessionId: (sessionId) => set({ sessionId }),
  setUploadProgress: (progress) => set({ uploadProgress: progress }),
  setUploading: (uploading) => set({ isUploading: uploading }),
  setUploadError: (error) => set({ uploadError: error }),
  
  resetUpload: () => set({
    sessionId: null,
    uploadProgress: 0,
    isUploading: false,
    uploadError: null,
  }),
});
