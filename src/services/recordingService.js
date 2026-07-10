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
  const { overlayWidth = 560, overlayHeight = 420 } = options;

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

  // ── Canvas ────────────────────────────────────────────────────────────────
  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext("2d", { alpha: false });

  let animFrameId;
  let running = true;

  function draw() {
    if (!running) return;

    ctx.drawImage(screenVideo, 0, 0, canvasWidth, canvasHeight);

    const pad = 28;
    const x = canvasWidth - overlayWidth - pad;
    const y = canvasHeight - overlayHeight - pad;
    const radius = 20;

    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.55)";
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 4;
    ctx.beginPath();
    ctx.roundRect(x, y, overlayWidth, overlayHeight, radius);
    ctx.clip();
    ctx.shadowColor = "transparent";
    ctx.translate(x + overlayWidth, y);
    ctx.scale(-1, 1);
    ctx.drawImage(cameraVideo, 0, 0, overlayWidth, overlayHeight);
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.22)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(x, y, overlayWidth, overlayHeight, radius);
    ctx.stroke();
    ctx.restore();

    animFrameId = requestAnimationFrame(draw);
  }

  draw();

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
    cancelAnimationFrame(animFrameId);

    // Detach srcObject BEFORE stopping tracks
    screenVideo.pause();
    cameraVideo.pause();
    screenVideo.srcObject = null;
    cameraVideo.srcObject = null;

    // Remove from DOM
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
