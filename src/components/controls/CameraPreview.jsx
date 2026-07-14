import { useEffect, useRef, useState } from "react";
import { useRecorderStore } from "../../context/recorderStore";
import { RECORDING_STATE, RECORDING_MODE } from "../../constants";
import { clsx } from "clsx";
import { EyeOff, Eye } from "lucide-react";

export function CameraPreview() {
  const { cameraStream, mode, recordingState } = useRecorderStore();
  const videoRef = useRef(null);
  const [hasFrame, setHasFrame] = useState(false);
  const [hidden, setHidden] = useState(false);

  const isScreenMode = mode === RECORDING_MODE.SCREEN_CAMERA;
  // SCREEN_CAMERA: canvas already draws camera — hide live preview to avoid double camera
  const isActiveMode = mode === RECORDING_MODE.CAMERA;
  const isActiveState =
    recordingState === RECORDING_STATE.RECORDING ||
    recordingState === RECORDING_STATE.PAUSED;

  const visible = isActiveMode && isActiveState && !!cameraStream;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (cameraStream && isActiveState) {
      video.srcObject = cameraStream;
      setHasFrame(false);
      video.play().catch(() => {});
    } else {
      video.srcObject = null;
      setHasFrame(false);
    }
  }, [cameraStream, isActiveState]);

  useEffect(() => {
    if (!isActiveState) setHidden(false);
  }, [isActiveState]);

  if (!visible) return null;

  return (
    <div
      className={clsx(
        "fixed bottom-6 right-6 z-[9998] transition-all duration-300",
        hasFrame
          ? "opacity-100 scale-100"
          : "opacity-0 scale-90 pointer-events-none",
      )}
    >
      {/* Hide/show toggle */}
      <button
        onClick={() => setHidden((h) => !h)}
        className="absolute -top-3 -left-3 z-10 w-7 h-7 rounded-full bg-white
          border border-[#ebebf0] flex items-center justify-center
          shadow-md hover:bg-[#f8f8fa] transition-colors cursor-pointer"
        title={hidden ? "Show camera" : "Hide camera"}
      >
        {hidden ? (
          <Eye size={13} className="text-[#555570]" />
        ) : (
          <EyeOff size={13} className="text-[#555570]" />
        )}
      </button>

      {/* Round camera */}
      <div
        className={clsx(
          "relative transition-all duration-300",
          hidden
            ? "opacity-0 scale-90 pointer-events-none"
            : "opacity-100 scale-100",
        )}
        style={{
          width: 180,
          height: 180,
          borderRadius: "50%",
          overflow: "hidden",
          boxShadow: "0 8px 32px rgba(0,0,0,.3), 0 0 0 3px rgba(139,92,246,.5)",
        }}
      >
        <video
          ref={videoRef}
          muted
          playsInline
          onCanPlay={() => setHasFrame(true)}
          style={{
            width: "180px",
            height: "180px",
            objectFit: "cover",
            display: "block",
            transform: "scaleX(-1)",
            background: "#1a1a2e",
          }}
        />

        {/* LIVE badge */}
        <div
          className="absolute top-3 left-3 flex items-center gap-1.5
          bg-white/85 backdrop-blur-sm rounded-full px-2.5 py-1 shadow-sm"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute h-full w-full rounded-full bg-red-400 opacity-60" />
            <span className="relative h-1.5 w-1.5 rounded-full bg-red-500 block rec-dot" />
          </span>
          <span className="text-[10px] font-bold text-red-600 tracking-[0.06em]">
            LIVE
          </span>
        </div>
      </div>
    </div>
  );
}
