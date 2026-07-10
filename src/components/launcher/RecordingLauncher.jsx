import { useEffect } from "react";
import {
  Monitor,
  Camera,
  Layers,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useRecorderStore } from "../../context/recorderStore";
import { useRecorder } from "../../hooks/useRecorder";
import { Button } from "../ui/Button";
import { Toggle } from "../ui/Toggle";
import { RECORDING_MODE } from "../../constants";
import { isSystemAudioLikelySupported } from "../../utils";
import { clsx } from "clsx";

const MODES = [
  {
    key: RECORDING_MODE.SCREEN,
    label: "Screen",
    icon: Monitor,
    desc: "Full screen or window",
  },
  {
    key: RECORDING_MODE.CAMERA,
    label: "Camera",
    icon: Camera,
    desc: "Webcam only",
  },
  {
    key: RECORDING_MODE.SCREEN_CAMERA,
    label: "Screen + Cam",
    icon: Layers,
    desc: "Overlay camera",
  },
];

export function RecordingLauncher() {
  const {
    isLauncherOpen,
    closeLauncher,
    mode,
    setMode,
    micEnabled,
    toggleMic,
    systemAudioEnabled,
    toggleSystemAudio,
    error,
    clearError,
    recordingState,
  } = useRecorderStore();

  const { startRecording } = useRecorder();
  const isRequesting = recordingState === "requesting";
  const systemAudioSupported = isSystemAudioLikelySupported();

  useEffect(() => {
    if (!isLauncherOpen) return;
    const fn = (e) => {
      if (e.key === "Escape") closeLauncher();
    };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [isLauncherOpen, closeLauncher]);

  if (!isLauncherOpen) return null;

  const handleStart = async () => {
    clearError();
    closeLauncher();
    await startRecording();
  };

  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center p-5">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/25 backdrop-blur-[6px] anim-fade-in"
        onClick={closeLauncher}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-[400px] anim-modal-in">
        <div className="surface-modal overflow-hidden">
          {/* ── Header ── */}
          <div
            className="flex items-center justify-between px-6 py-5"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-[10px] flex items-center justify-center"
                style={{
                  background: "var(--purple)",
                  boxShadow: "var(--shadow-purple)",
                }}
              >
                <div className="w-3 h-3 rounded-full bg-white/90" />
              </div>
              <span
                className="text-[15px] font-semibold"
                style={{ color: "var(--text-1)" }}
              >
                New recording
              </span>
            </div>
            <button
              onClick={closeLauncher}
              className="w-8 h-8 rounded-[10px] flex items-center justify-center transition-colors"
              style={{ color: "var(--text-3)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--bg-soft)";
                e.currentTarget.style.color = "var(--text-1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--text-3)";
              }}
            >
              <X size={16} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* ── Recording Mode ── */}
            <div>
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.08em] mb-3"
                style={{ color: "var(--text-3)" }}
              >
                Recording mode
              </p>
              <div className="grid grid-cols-3 gap-2.5">
                {MODES.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setMode(key)}
                    className={clsx(
                      "relative flex flex-col items-center gap-2.5 py-4 px-2 rounded-[14px] border transition-all duration-150 text-center",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/50 cursor-pointer",
                    )}
                    style={{
                      background:
                        mode === key ? "var(--purple-soft)" : "var(--bg-soft)",
                      borderColor:
                        mode === key ? "var(--purple-border)" : "var(--border)",
                      color: mode === key ? "var(--purple)" : "var(--text-2)",
                    }}
                  >
                    <Icon size={20} />
                    <span className="text-[12px] font-medium leading-tight">
                      {label}
                    </span>
                    {mode === key && (
                      <span
                        className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full"
                        style={{ background: "var(--purple)" }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Divider ── */}
            <div className="divider" />

            {/* ── Options ── */}
            <div className="space-y-1">
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.08em] mb-3"
                style={{ color: "var(--text-3)" }}
              >
                Options
              </p>

              <OptionRow>
                <Toggle
                  checked={micEnabled}
                  onChange={toggleMic}
                  icon={micEnabled ? <Mic size={15} /> : <MicOff size={15} />}
                  label="Microphone"
                  sublabel={micEnabled ? "On" : "Off"}
                />
              </OptionRow>

              {(mode === RECORDING_MODE.SCREEN ||
                mode === RECORDING_MODE.SCREEN_CAMERA) && (
                <OptionRow>
                  <Toggle
                    checked={systemAudioEnabled}
                    onChange={toggleSystemAudio}
                    disabled={!systemAudioSupported}
                    icon={
                      systemAudioEnabled ? (
                        <Volume2 size={15} />
                      ) : (
                        <VolumeX size={15} />
                      )
                    }
                    label="System audio"
                    sublabel={
                      !systemAudioSupported
                        ? "Not supported"
                        : systemAudioEnabled
                          ? "On"
                          : "Off"
                    }
                  />
                </OptionRow>
              )}
            </div>

            {/* ── Error ── */}
            {error && (
              <div
                className="rounded-[14px] border px-4 py-3 text-[13px] anim-fade-in"
                style={{
                  borderColor: "#fecaca",
                  background: "#fef2f2",
                  color: "#dc2626",
                }}
              >
                {error}
              </div>
            )}

            {/* ── Start CTA ── */}
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleStart}
              loading={isRequesting}
              disabled={isRequesting}
            >
              {!isRequesting && (
                <span className="w-2.5 h-2.5 rounded-full bg-white/80" />
              )}
              {isRequesting ? "Requesting access…" : "Start recording"}
            </Button>

            <p
              className="text-center text-[11px]"
              style={{ color: "var(--text-3)" }}
            >
              Press{" "}
              <kbd
                className="px-1.5 py-0.5 rounded-[6px] font-mono text-[10px]"
                style={{
                  background: "var(--bg-soft)",
                  border: "1px solid var(--border)",
                  color: "var(--text-2)",
                }}
              >
                Esc
              </kbd>{" "}
              to cancel
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function OptionRow({ children }) {
  return (
    <div
      className="flex items-center px-3 py-3 rounded-[12px] transition-colors"
      style={{ cursor: "default" }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.background = "var(--bg-soft)")
      }
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {children}
    </div>
  );
}
