/**
 * Recording Service
 *
 * Low-level helpers for MediaRecorder lifecycle, stream combination,
 * and canvas-based compositing (screen + camera overlay).
 */

import { MIME_TYPES } from '../constants';
import { getSupportedMimeType } from '../utils';

/**
 * Create a MediaRecorder from the given stream with the best
 * supported MIME type.
 */
export function createMediaRecorder(stream, onDataAvailable, onStop) {
  const mimeType = getSupportedMimeType(MIME_TYPES);
  const options = mimeType ? { mimeType } : {};

  const recorder = new MediaRecorder(stream, options);

  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) onDataAvailable(e.data);
  };

  recorder.onstop = onStop;

  return recorder;
}

/**
 * Wait for a video element to have enough data to draw a real frame.
 * Resolves immediately if already ready.
 */
function waitForVideoReady(videoEl) {
  return new Promise((resolve) => {
    // readyState >= 2 means HAVE_CURRENT_DATA — a frame is available
    if (videoEl.readyState >= 2) {
      resolve();
      return;
    }
    const onReady = () => {
      videoEl.removeEventListener('loadeddata', onReady);
      videoEl.removeEventListener('canplay', onReady);
      resolve();
    };
    videoEl.addEventListener('loadeddata', onReady);
    videoEl.addEventListener('canplay', onReady);

    // Safety timeout — proceed anyway after 3s
    setTimeout(resolve, 3000);
  });
}

/**
 * Combine a screen stream and a camera stream using Canvas API.
 * The camera feed is drawn as a PiP overlay in the bottom-right corner.
 *
 * FIX: wait for both video elements to have frames before sizing canvas,
 * use native screen resolution instead of hardcoded fallback,
 * and mirror the camera correctly without canvas transform.
 */
export async function createCompositeStream(
  screenStream,
  cameraStream,
  audioStream,
  options = {}
) {
  const { overlayWidth = 240, overlayHeight = 180 } = options;

  // ── Screen video ─────────────────────────────────────────────────────────
  const screenVideo = document.createElement('video');
  screenVideo.srcObject = screenStream;
  screenVideo.muted = true;
  screenVideo.playsInline = true;
  await screenVideo.play();
  await waitForVideoReady(screenVideo);

  // Use actual video dimensions — don't rely on getSettings() which can lag
  const canvasWidth  = screenVideo.videoWidth  || 1920;
  const canvasHeight = screenVideo.videoHeight || 1080;

  // ── Camera video ─────────────────────────────────────────────────────────
  const cameraVideo = document.createElement('video');
  cameraVideo.srcObject = cameraStream;
  cameraVideo.muted = true;
  cameraVideo.playsInline = true;
  await cameraVideo.play();
  await waitForVideoReady(cameraVideo);

  // ── Canvas ────────────────────────────────────────────────────────────────
  const canvas = document.createElement('canvas');
  canvas.width  = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d', { alpha: false });

  let animFrameId;

  function draw() {
    // Draw full screen
    ctx.drawImage(screenVideo, 0, 0, canvasWidth, canvasHeight);

    // Camera PiP — bottom-right corner
    const pad    = 28;
    const x      = canvasWidth  - overlayWidth  - pad;
    const y      = canvasHeight - overlayHeight - pad;
    const radius = 20;

    // Shadow under camera bubble
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur  = 20;
    ctx.shadowOffsetY = 4;

    // Clip to rounded rect
    ctx.beginPath();
    ctx.roundRect(x, y, overlayWidth, overlayHeight, radius);
    ctx.clip();
    ctx.shadowColor = 'transparent'; // don't shadow the video itself

    // Mirror camera horizontally (selfie-style)
    ctx.translate(x + overlayWidth, y);
    ctx.scale(-1, 1);
    ctx.drawImage(cameraVideo, 0, 0, overlayWidth, overlayHeight);
    ctx.restore();

    // Border ring
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(x, y, overlayWidth, overlayHeight, radius);
    ctx.stroke();
    ctx.restore();

    animFrameId = requestAnimationFrame(draw);
  }

  draw();

  // ── Capture canvas stream at native fps ───────────────────────────────────
  // Use 0 to let browser choose optimal fps (avoids artificial cap)
  const canvasStream = canvas.captureStream(0);

  // Add audio — mic takes priority, then system audio from screen
  const audioTracks = [
    ...(audioStream?.getAudioTracks()  || []),
    ...screenStream.getAudioTracks(),
  ];
  audioTracks.forEach((t) => canvasStream.addTrack(t));

  const cleanup = () => {
    cancelAnimationFrame(animFrameId);
    screenVideo.srcObject = null;
    cameraVideo.srcObject = null;
  };

  return { combinedStream: canvasStream, cleanup };
}

/**
 * Capture a screenshot from a MediaStream or HTMLVideoElement.
 *
 * FIX: was drawing immediately after .play() before any frames arrived,
 * producing a blank/black image. Now waits for readyState >= 2.
 *
 * @param {MediaStream|HTMLVideoElement} source
 * @returns {Promise<Blob>} PNG blob
 */
export async function captureScreenshot(source) {
  let videoEl;
  let shouldCleanup = false;

  if (source instanceof MediaStream) {
    videoEl = document.createElement('video');
    videoEl.srcObject = source;
    videoEl.muted = true;
    videoEl.playsInline = true;
    shouldCleanup = true;
    await videoEl.play();
  } else {
    videoEl = source;
  }

  // Wait until a real frame is available
  await waitForVideoReady(videoEl);

  const width  = videoEl.videoWidth  || 1280;
  const height = videoEl.videoHeight || 720;

  const canvas = document.createElement('canvas');
  canvas.width  = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(videoEl, 0, 0, width, height);

  if (shouldCleanup) {
    videoEl.pause();
    videoEl.srcObject = null;
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to capture screenshot — canvas toBlob returned null'));
    }, 'image/png');
  });
}
