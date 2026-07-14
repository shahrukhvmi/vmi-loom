/**
 * Format seconds to MM:SS or HH:MM:SS
 */
export function formatDuration(seconds) {
  if (
    seconds === null ||
    seconds === undefined ||
    isNaN(seconds) ||
    !isFinite(seconds)
  )
    return "00:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * Format bytes to human-readable file size
 */
export function formatFileSize(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

/**
 * Get the best supported MIME type for MediaRecorder
 */
export function getSupportedMimeType(mimeTypes) {
  for (const type of mimeTypes) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return "";
}

/**
 * Get video resolution from a MediaStream.
 *
 * FIX: getSettings() can return 0/undefined immediately after stream creation
 * before the track is fully initialised. We fall back gracefully.
 */
export function getStreamResolution(stream) {
  if (!stream) return null;
  const videoTrack = stream.getVideoTracks?.()?.[0];
  if (!videoTrack) return null;
  const s = videoTrack.getSettings();
  if (s.width && s.height) return `${s.width}×${s.height}`;
  // Fallback: try capabilities
  const caps = videoTrack.getCapabilities?.();
  if (caps?.width?.max && caps?.height?.max) {
    return `${caps.width.max}×${caps.height.max}`;
  }
  return null;
}

/**
 * Trigger a browser download
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Generate a timestamped filename
 */
export function generateFilename(prefix = "recording", ext = "webm") {
  const now = new Date();
  const ts = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
  return `${prefix}-${ts}.${ext}`;
}

/**
 * Stop all tracks in a MediaStream
 */
export function stopAllTracks(stream) {
  if (!stream) return;
  stream.getTracks().forEach((track) => track.stop());
}

/**
 * Clamp a value between min and max
 */
export function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

/**
 * Detect if browser is Safari
 */
export function isSafari() {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}

/**
 * Check if system audio capture might be supported
 */
export function isSystemAudioLikelySupported() {
  return !isSafari() && !!navigator.mediaDevices?.getDisplayMedia;
}
