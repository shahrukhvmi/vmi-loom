import { create } from 'zustand';
import { RECORDING_STATE, RECORDING_MODE, PERMISSION_STATE } from '../constants';

const initialState = {
  isLauncherOpen: false,
  mode: RECORDING_MODE.SCREEN,
  micEnabled: true,
  cameraEnabled: false,
  systemAudioEnabled: false,
  recordingState: RECORDING_STATE.IDLE,
  elapsedSeconds: 0,
  isPaused: false,
  screenStream: null,
  cameraStream: null,
  micStream: null,
  combinedStream: null,
  mediaRecorder: null,
  compositeCleanup: null,
  recordedBlob: null,
  recordedUrl: null,
  recordedMimeType: '',
  recordingResolution: null,
  permissions: {
    screen: PERMISSION_STATE.UNKNOWN,
    camera: PERMISSION_STATE.UNKNOWN,
    microphone: PERMISSION_STATE.UNKNOWN,
  },
  screenshots: [],
  // Screenshot preview modal
  screenshotPreviewId: null,   // which screenshot to show in fullscreen preview
  uploadProgress: 0,
  uploadedRecord: null,
  error: null,
};

export const useRecorderStore = create((set, get) => ({
  ...initialState,

  openLauncher:  () => set({ isLauncherOpen: true }),
  closeLauncher: () => set({ isLauncherOpen: false }),

  setMode: (mode) => set({ mode }),
  toggleMic:         () => set((s) => ({ micEnabled:         !s.micEnabled })),
  toggleCamera:      () => set((s) => ({ cameraEnabled:      !s.cameraEnabled })),
  toggleSystemAudio: () => set((s) => ({ systemAudioEnabled: !s.systemAudioEnabled })),

  setRecordingState: (recordingState) => set({ recordingState }),
  setElapsedSeconds: (elapsedSeconds) => set({ elapsedSeconds }),
  setIsPaused:       (isPaused)       => set({ isPaused }),
  setStreams:        (streams)        => set(streams),
  setMediaRecorder:  (mediaRecorder)  => set({ mediaRecorder }),
  setCompositeCleanup: (compositeCleanup) => set({ compositeCleanup }),

  setRecordedOutput: ({ blob, url, mimeType, resolution }) =>
    set({ recordedBlob: blob, recordedUrl: url, recordedMimeType: mimeType, recordingResolution: resolution }),

  setPermission: (key, value) =>
    set((s) => ({ permissions: { ...s.permissions, [key]: value } })),

  addScreenshot:    (shot) => set((s) => ({ screenshots: [shot, ...s.screenshots] })),
  removeScreenshot: (id)   => set((s) => ({ screenshots: s.screenshots.filter((sh) => sh.id !== id) })),

  // Screenshot preview modal
  openScreenshotPreview:  (id) => set({ screenshotPreviewId: id }),
  closeScreenshotPreview: ()   => set({ screenshotPreviewId: null }),

  setUploadProgress: (uploadProgress)   => set({ uploadProgress }),
  setUploadedRecord: (uploadedRecord)   => set({ uploadedRecord }),
  setError:          (error)            => set({ error }),
  clearError:        ()                 => set({ error: null }),

  reset: () => {
    const { recordedUrl, screenshots, compositeCleanup } = get();
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    screenshots.forEach((s) => { if (s.url) URL.revokeObjectURL(s.url); });
    compositeCleanup?.();
    set({ ...initialState });
  },
}));
