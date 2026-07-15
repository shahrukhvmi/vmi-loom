/**
 * useScreenshot
 *
 * Provides three capture modes:
 *   1. captureFromActiveStream  — snapshot from current recording stream
 *   2. captureFullScreen        — getDisplayMedia, capture whole share, stop
 *   3. captureArea              — getDisplayMedia, then draw a selection overlay
 *                                 on canvas so user can drag-crop the region
 *
 * After capture, the result is stored in the Zustand store and the screenshot
 * preview modal is opened automatically.
 */

import { useCallback } from "react";
import { useRecorderStore } from "../context/recorderStore";
import { captureScreenshot } from "../services/recordingService";
import { downloadBlob, generateFilename } from "../utils";

/* ── helpers ── */
function blobToBase64(blob) {
  return new Promise((res) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.readAsDataURL(blob);
  });
}

/**
 * Shows a full-screen canvas overlay on top of a captured image,
 * lets the user drag-select a rectangle, then crops and returns that region as a Blob.
 */
function showAreaSelector(fullBlob) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objUrl = URL.createObjectURL(fullBlob);
    img.src = objUrl;

    img.onload = () => {
      URL.revokeObjectURL(objUrl);

      // Full-screen overlay canvas — match viewport exactly
      const canvas = document.createElement("canvas");
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      Object.assign(canvas.style, {
        position: "fixed",
        inset: "0",
        zIndex: "2147483647",
        cursor: "crosshair",
        display: "block",
        width: window.innerWidth + "px",
        height: window.innerHeight + "px",
      });
      const ctx = canvas.getContext("2d");
      document.body.appendChild(canvas);

      // Draw the captured screenshot as background
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Dark overlay
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Instructions
      ctx.fillStyle = "rgba(255,255,255,0.92)";
      ctx.font = "bold 15px Inter, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(
        "Drag to select area  ·  Press Esc to cancel",
        canvas.width / 2,
        canvas.height / 2,
      );

      let startX = 0,
        startY = 0,
        dragging = false;

      // Scale factors from canvas coords to image source coords
      const imgScaleX = img.naturalWidth / canvas.width;
      const imgScaleY = img.naturalHeight / canvas.height;

      const redraw = (x, y, w, h) => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "rgba(0,0,0,0.45)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (w > 0 && h > 0) {
          // Clear selected area (show original bright)
          ctx.clearRect(x, y, w, h);
          // Map canvas coords to source image coords for proper cropping
          ctx.drawImage(
            img,
            x * imgScaleX,
            y * imgScaleY,
            w * imgScaleX,
            h * imgScaleY,
            x,
            y,
            w,
            h,
          );

          // Dashed selection border
          ctx.strokeStyle = "#7c3aed";
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 3]);
          ctx.strokeRect(x, y, w, h);

          // Corner handles
          ctx.fillStyle = "#7c3aed";
          [
            [x, y],
            [x + w, y],
            [x, y + h],
            [x + w, y + h],
          ].forEach(([cx, cy]) => {
            ctx.beginPath();
            ctx.arc(cx, cy, 5, 0, Math.PI * 2);
            ctx.fill();
          });

          // Size label
          ctx.setLineDash([]);
          ctx.fillStyle = "#7c3aed";
          ctx.fillRect(x, y - 24, 90, 22);
          ctx.fillStyle = "#fff";
          ctx.font = "12px Inter, system-ui, sans-serif";
          ctx.textAlign = "left";
          ctx.fillText(`${Math.round(w)} × ${Math.round(h)}`, x + 6, y - 8);
        }
      };

      const onDown = (e) => {
        dragging = true;
        startX = e.clientX;
        startY = e.clientY;
      };
      const onMove = (e) => {
        if (!dragging) return;
        const w = e.clientX - startX;
        const h = e.clientY - startY;
        redraw(startX, startY, w, h);
      };
      const onUp = (e) => {
        if (!dragging) return;
        dragging = false;

        const x = Math.min(startX, e.clientX);
        const y = Math.min(startY, e.clientY);
        const w = Math.abs(e.clientX - startX);
        const h = Math.abs(e.clientY - startY);

        document.body.removeChild(canvas);

        if (w < 10 || h < 10) {
          reject(new Error("Selection too small"));
          return;
        }

        // Crop the original full image to the selected rectangle
        // Scale from viewport px to actual image px
        const scaleX = img.naturalWidth / window.innerWidth;
        const scaleY = img.naturalHeight / window.innerHeight;

        const crop = document.createElement("canvas");
        crop.width = Math.round(w * scaleX);
        crop.height = Math.round(h * scaleY);
        crop
          .getContext("2d")
          .drawImage(
            img,
            x * scaleX,
            y * scaleY,
            crop.width,
            crop.height,
            0,
            0,
            crop.width,
            crop.height,
          );
        crop.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Crop failed"));
        }, "image/png");
      };

      const onKey = (e) => {
        if (e.key === "Escape") {
          document.body.removeChild(canvas);
          document.removeEventListener("keydown", onKey);
          reject(new Error("Cancelled"));
        }
      };

      canvas.addEventListener("mousedown", onDown);
      canvas.addEventListener("mousemove", onMove);
      canvas.addEventListener("mouseup", onUp);
      document.addEventListener("keydown", onKey);
    };

    img.onerror = () => reject(new Error("Image load failed"));
  });
}

export function useScreenshot() {
  const store = useRecorderStore();
  const {
    screenStream,
    cameraStream,
    combinedStream,
    addScreenshot,
    openScreenshotPreview,
  } = store;

  const _save = useCallback(
    (blob) => {
      const url = URL.createObjectURL(blob);
      const id = `screenshot-${Date.now()}`;
      addScreenshot({ id, url, blob, capturedAt: new Date() });
      openScreenshotPreview(id); // ← auto-open preview modal
      return { id, url, blob };
    },
    [addScreenshot, openScreenshotPreview],
  );

  /** Capture from active recording stream (during recording) */
  const captureFromActiveStream = useCallback(async () => {
    const source = combinedStream || screenStream || cameraStream;
    if (!source) throw new Error("No active stream to capture from.");
    const blob = await captureScreenshot(source);
    return _save(blob);
  }, [screenStream, cameraStream, combinedStream, _save]);

  /** Capture full screen (opens share picker, grabs one frame, stops) */
  const captureFullScreen = useCallback(async () => {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: { cursor: "always", frameRate: { ideal: 1 } },
      audio: false,
    });
    let blob;
    try {
      blob = await captureScreenshot(stream);
    } finally {
      stream.getTracks().forEach((t) => t.stop());
    }
    return _save(blob);
  }, [_save]);

  /**
   * Capture selected area:
   *   1. Grab full screen silently
   *   2. Show drag-selection overlay
   *   3. Crop to selection
   */
  const captureArea = useCallback(async () => {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: { cursor: "never", frameRate: { ideal: 1 } },
      audio: false,
    });
    let fullBlob;
    try {
      fullBlob = await captureScreenshot(stream);
    } finally {
      stream.getTracks().forEach((t) => t.stop());
    }

    // Show selection overlay — may reject if user presses Esc
    const croppedBlob = await showAreaSelector(fullBlob);
    return _save(croppedBlob);
  }, [_save]);

  /** Legacy alias used by HomePage "Screenshot" button — opens mode picker */
  const captureNewScreenshot = captureFullScreen;

  const downloadScreenshot = useCallback((shot) => {
    downloadBlob(shot.blob, generateFilename("screenshot", "png"));
  }, []);

  const copyScreenshot = useCallback(async (shot) => {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": shot.blob }),
      ]);
      return true;
    } catch {
      return false;
    }
  }, []);

  return {
    captureFromActiveStream,
    captureFullScreen,
    captureArea,
    captureNewScreenshot,
    downloadScreenshot,
    copyScreenshot,
  };
}
