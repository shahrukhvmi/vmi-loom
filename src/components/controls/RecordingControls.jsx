import { useState, useEffect } from "react";
import { Pause, Play, Square, X, Camera, Maximize, Crop } from "lucide-react";
import { useRecorderStore } from "../../context/recorderStore";
import { useRecorder } from "../../hooks/useRecorder";
import { useScreenshot } from "../../hooks/useScreenshot";
import { RecordingTimer } from "./RecordingTimer";
import { RECORDING_STATE, RECORDING_MODE } from "../../constants";
import { clsx } from "clsx";

export function RecordingControls() {
  const { recordingState, elapsedSeconds, isPaused, mode } = useRecorderStore();
  const { pauseRecording, resumeRecording, stopRecording, cancelRecording } =
    useRecorder();
  const { captureFromActiveStream, captureArea } = useScreenshot();
  const [showShotMenu, setShowShotMenu] = useState(false);
  const [shotLoading, setShotLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  const isActive =
    recordingState === RECORDING_STATE.RECORDING ||
    recordingState === RECORDING_STATE.PAUSED;

  // FIX: delay showing the bar so it doesn't appear in the screen share picker.
  // When screen mode: wait 2.5s after recording starts so the user has already
  // clicked "Share" and the bar won't be captured in the recording itself.
  // Camera-only mode: show immediately (no screen being captured).
  useEffect(() => {
    if (!isActive) {
      setVisible(false);
      return;
    }
    if (mode === RECORDING_MODE.CAMERA) {
      setVisible(true);
      return;
    }
    // Screen or Screen+Camera — delay so bar appears AFTER share dialog closes
    const t = setTimeout(() => setVisible(true), 2500);
    return () => clearTimeout(t);
  }, [isActive, mode]);

  if (!isActive || !visible) return null;

  const takeShot = async (mode) => {
    setShowShotMenu(false);
    setShotLoading(true);
    try {
      if (mode === "area") await captureArea();
      else await captureFromActiveStream();
    } catch {}
    setShotLoading(false);
  };

  return (
    <div
      className="fixed bottom-7 left-1/2 z-[9999] anim-slide-bar"
      style={{ transform: "translateX(-50%)" }}
    >
      <div
        className="flex items-center gap-1.5 px-2.5 py-2.5 rounded-[18px] bg-white border border-[#ebebf0]"
        style={{
          boxShadow: "0 12px 40px rgba(0,0,0,.12), 0 4px 12px rgba(0,0,0,.06)",
        }}
      >
        <RecordingTimer seconds={elapsedSeconds} isPaused={isPaused} />

        <Sep />

        {/* Pause/Resume */}
        <CtrlBtn
          onClick={isPaused ? resumeRecording : pauseRecording}
          title={isPaused ? "Resume" : "Pause"}
        >
          {isPaused ? (
            <Play size={16} fill="currentColor" className="text-[#7c3aed]" />
          ) : (
            <Pause size={16} className="text-[#555570]" />
          )}
        </CtrlBtn>

        {/* Screenshot */}
        <div className="relative">
          <CtrlBtn
            onClick={() => setShowShotMenu(!showShotMenu)}
            title="Screenshot"
            disabled={shotLoading}
          >
            {shotLoading ? (
              <svg
                className="animate-spin h-4 w-4 text-[#7c3aed]"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            ) : (
              <Camera size={16} className="text-[#555570]" />
            )}
          </CtrlBtn>

          {showShotMenu && (
            <div
              className="absolute bottom-full mb-2.5 left-1/2 -translate-x-1/2 w-48
              bg-white border border-[#ebebf0] rounded-[12px] overflow-hidden anim-scale-in"
              style={{ boxShadow: "0 8px 24px rgba(0,0,0,.08)" }}
            >
              <button
                onClick={() => takeShot("stream")}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-[13px] text-[#1a1a2e] hover:bg-[#f8f8fa] transition-colors text-left"
              >
                <Maximize size={14} className="text-[#8c8ca3]" /> Full screen
              </button>
              <button
                onClick={() => takeShot("area")}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-[13px] text-[#1a1a2e] hover:bg-[#f8f8fa] transition-colors text-left border-t border-[#ebebf0]"
              >
                <Crop size={14} className="text-[#8c8ca3]" /> Selected area
              </button>
            </div>
          )}
        </div>

        <Sep />

        {/* Stop */}
        <button
          onClick={stopRecording}
          className="flex items-center gap-2 px-4 py-2.5 rounded-[12px] text-[13px] font-medium
            bg-[#fef2f2] hover:bg-[#fee2e2] text-[#dc2626] border border-[#fecaca]
            transition-all duration-150 active:scale-95"
        >
          <Square size={12} fill="currentColor" />
          Stop
        </button>

        <Sep />

        {/* Cancel */}
        <CtrlBtn onClick={cancelRecording} title="Discard">
          <X size={15} className="text-[#8c8ca3]" />
        </CtrlBtn>
      </div>
    </div>
  );
}

function CtrlBtn({ children, onClick, title, disabled }) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={clsx(
        "w-9 h-9 flex items-center justify-center rounded-[10px]",
        "hover:bg-[#f8f8fa] transition-all duration-100 active:scale-90",
        disabled && "opacity-50 pointer-events-none",
      )}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <div className="w-px h-5 mx-0.5 bg-[#e8e8ee]" />;
}
