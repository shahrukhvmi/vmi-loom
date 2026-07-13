// Recording modes
export const RECORDING_MODE = {
  SCREEN: "screen",
  CAMERA: "camera",
  SCREEN_CAMERA: "screen+camera",
};

// Recording states
export const RECORDING_STATE = {
  IDLE: "idle",
  REQUESTING: "requesting",
  RECORDING: "recording",
  PAUSED: "paused",
  STOPPED: "stopped",
  PREVIEW: "preview",
  UPLOADING: "uploading",
  UPLOADED: "uploaded",
  ERROR: "error",
};

// Permission states
export const PERMISSION_STATE = {
  UNKNOWN: "unknown",
  GRANTED: "granted",
  DENIED: "denied",
  BLOCKED: "blocked",
  NOT_FOUND: "not_found",
  CANCELLED: "cancelled",
};

// Supported MIME types in preference order
export const MIME_TYPES = [
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm",
  "video/mp4",
];

export const SCREENSHOT_FORMAT = "image/png";

export const MAX_RECORDING_DURATION_MS = 60 * 60 * 1000; // 1 hour

export const CAMERA_OVERLAY_SIZES = {
  small: { width: 160, height: 120, label: "Small" },
  medium: { width: 220, height: 165, label: "Medium" },
  large: { width: 300, height: 225, label: "Large" },
};
