import { MIME_TYPES } from "../constants";
import { getSupportedMimeType } from "../utils";

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

function waitForVideoReady(videoEl) {
  return new Promise((resolve) => {
    if (videoEl.readyState >= 2) {
      resolve();
      return;
    }
    const onReady = () => {
      videoEl.removeEventListener("loadeddata", onReady);
      videoEl.removeEventListener("canplay", onReady);
      resolve();
    };
    videoEl.addEventListener("loadeddata", onReady);
    videoEl.addEventListener("canplay", onReady);
    setTimeout(resolve, 3000);
  });
}

export async function createCompositeStream(
  screenStream,
  cameraStream,
  audioStream,
  options = {},
) {
  // overlayWidth/Height set after canvas size is known below

  // ── Screen video ──────────────────────────────────────────────────────────
  const screenVideo = document.createElement("video");
  screenVideo.srcObject = screenStream;
  screenVideo.muted = true;
  screenVideo.playsInline = true;
  screenVideo.autoplay = true;
  Object.assign(screenVideo.style, {
    position: "fixed",
    top: "-2px",
    left: "-2px",
    width: "1px",
    height: "1px",
    opacity: "0.01", // not 0 — some browsers throttle opacity:0 elements
    pointerEvents: "none",
    zIndex: "-999",
  });
  document.body.appendChild(screenVideo);
  await screenVideo.play();
  await waitForVideoReady(screenVideo);

  const canvasWidth = screenVideo.videoWidth || 1920;
  const canvasHeight = screenVideo.videoHeight || 1080;

  // ── Camera video ──────────────────────────────────────────────────────────
  const cameraVideo = document.createElement("video");
  cameraVideo.srcObject = cameraStream;
  cameraVideo.muted = true;
  cameraVideo.playsInline = true;
  cameraVideo.autoplay = true;
  Object.assign(cameraVideo.style, {
    position: "fixed",
    top: "-2px",
    left: "-2px",
    width: "1px",
    height: "1px",
    opacity: "0.01",
    pointerEvents: "none",
    zIndex: "-999",
  });
  document.body.appendChild(cameraVideo);
  await cameraVideo.play();
  await waitForVideoReady(cameraVideo);

  console.log(
    "[composite] screen:",
    canvasWidth,
    "x",
    canvasHeight,
    "| camera:",
    cameraVideo.videoWidth,
    "x",
    cameraVideo.videoHeight,
    "| cam paused:",
    cameraVideo.paused,
    "| cam active:",
    cameraStream.active,
  );

  // FIX: when tab becomes visible again, resume video playback
  // Chrome throttles/pauses captured streams when tab is backgrounded
  const onVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      screenVideo.play().catch(() => {});
      cameraVideo.play().catch(() => {});
    }
  };
  document.addEventListener("visibilitychange", onVisibilityChange);

  // ── Canvas ────────────────────────────────────────────────────────────────
  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext("2d", { alpha: false });

  let intervalId;
  let running = true;

  // Dynamic size — 22% of shorter canvas dimension
  const overlayWidth = Math.round(Math.min(canvasWidth, canvasHeight) * 0.22);
  const overlayHeight = overlayWidth;
  const pad = Math.round(canvasWidth * 0.02);
  const x = canvasWidth - overlayWidth - pad;
  const y = canvasHeight - overlayHeight - pad;

  function draw() {
    if (!running) return;

    // Draw screen
    ctx.drawImage(screenVideo, 0, 0, canvasWidth, canvasHeight);

    // Camera PiP — circular
    const size = overlayWidth;
    const cx = x + size / 2;
    const cy = y + size / 2;
    const r = size / 2;

    // Drop shadow
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 6;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = "#000";
    ctx.fill();
    ctx.restore();

    // Circular clip + mirrored camera (object-fit: cover)
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    // Cover fit — maintain aspect ratio, crop to fill circle
    const vw = cameraVideo.videoWidth || size;
    const vh = cameraVideo.videoHeight || size;
    const scale = Math.max(size / vw, size / vh);
    const dw = vw * scale;
    const dh = vh * scale;
    const dx = x + (size - dw) / 2;
    const dy = y + (size - dh) / 2;

    // Mirror horizontally
    ctx.translate(x + size / 2, 0);
    ctx.scale(-1, 1);
    ctx.translate(-(x + size / 2), 0);
    ctx.drawImage(cameraVideo, dx, dy, dw, dh);
    ctx.restore();

    // Purple ring border
    ctx.save();
    ctx.strokeStyle = "rgba(139,92,246,0.7)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, r - 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // FIX: use setInterval instead of requestAnimationFrame
  // rAF is throttled/paused when tab is in background or user switches apps
  // setInterval at ~30fps keeps drawing even when tab is not visible
  intervalId = setInterval(draw, 1000 / 30);

  const canvasStream = canvas.captureStream(30);

  const audioTracks = [
    ...(audioStream?.getAudioTracks() || []),
    ...screenStream.getAudioTracks(),
  ];
  audioTracks.forEach((t) => canvasStream.addTrack(t));

  // FIX: cleanup owns stopping the streams — NOT the caller (useRecorder/finalizeRecording)
  // This prevents camera being killed mid-recording when streams are cleaned up
  const cleanup = () => {
    running = false;
    clearInterval(intervalId);

    // Detach srcObject BEFORE stopping tracks
    screenVideo.pause();
    cameraVideo.pause();
    screenVideo.srcObject = null;
    cameraVideo.srcObject = null;

    // Remove event listener and DOM elements
    document.removeEventListener("visibilitychange", onVisibilityChange);
    screenVideo.remove();
    cameraVideo.remove();

    // NOW stop tracks — after detaching so canvas draw loop is already dead
    screenStream.getTracks().forEach((t) => t.stop());
    cameraStream.getTracks().forEach((t) => t.stop());
    if (audioStream) audioStream.getTracks().forEach((t) => t.stop());
  };

  return { combinedStream: canvasStream, cleanup };
}

export async function captureScreenshot(source) {
  let videoEl;
  let shouldCleanup = false;

  if (source instanceof MediaStream) {
    videoEl = document.createElement("video");
    videoEl.srcObject = source;
    videoEl.muted = true;
    videoEl.playsInline = true;
    shouldCleanup = true;
    await videoEl.play();
  } else {
    videoEl = source;
  }

  await waitForVideoReady(videoEl);

  const width = videoEl.videoWidth || 1280;
  const height = videoEl.videoHeight || 720;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d").drawImage(videoEl, 0, 0, width, height);

  if (shouldCleanup) {
    videoEl.pause();
    videoEl.srcObject = null;
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("toBlob returned null")),
      "image/png",
    );
  });
}
