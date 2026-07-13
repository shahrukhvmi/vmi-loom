import { useState, useRef, useCallback, useEffect } from "react";
import {
  Download,
  Trash2,
  ArrowLeft,
  MoreVertical,
  Link2,
  Lock,
  MessageCircle,
  Send,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Check,
  Upload,
  Loader2,
  ImageIcon,
  Clock,
  Edit3,
} from "lucide-react";
import { useRecorderStore } from "../context/recorderStore";
import { useUpload } from "../hooks/useUpload";
import { useScreenshot } from "../hooks/useScreenshot";
import {
  formatDuration,
  formatFileSize,
  downloadBlob,
  generateFilename,
  clamp,
} from "../utils";
import { RECORDING_MODE, RECORDING_STATE } from "../constants";

const MODE_LABEL = {
  [RECORDING_MODE.SCREEN]: "Screen recording",
  [RECORDING_MODE.CAMERA]: "Camera recording",
  [RECORDING_MODE.SCREEN_CAMERA]: "Screen + Camera",
};

/* ══════════════════════════════════════════════════════════════
   Inline Video Player — Loom-style
   ══════════════════════════════════════════════════════════════ */
function InlinePlayer({ src, onTimeUpdate }) {
  const videoRef = useRef(null);
  const trackRef = useRef(null);
  const hideTimer = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [ctrlVis, setCtrlVis] = useState(true);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !src) return;
    v.src = src;
    v.load();
    setPlaying(false);
    setCurrent(0);
    setDuration(0);
  }, [src]);

  const showCtrl = useCallback(() => {
    setCtrlVis(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setCtrlVis(false), 3000);
  }, []);

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPlaying(true);
      showCtrl();
    } else {
      v.pause();
      setPlaying(false);
      setCtrlVis(true);
      clearTimeout(hideTimer.current);
    }
  };

  const seek = (e) => {
    const v = videoRef.current,
      bar = trackRef.current;
    if (!v || !bar || !duration) return;
    const r = bar.getBoundingClientRect();
    v.currentTime = clamp((e.clientX - r.left) / r.width, 0, 1) * duration;
    showCtrl();
  };

  const pct = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <div
      className="relative bg-black overflow-hidden"
      style={{ aspectRatio: "16/9", borderRadius: "var(--radius-lg)" }}
      onMouseMove={showCtrl}
      onMouseLeave={() => playing && setCtrlVis(false)}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        onClick={toggle}
        onTimeUpdate={() => {
          const t = videoRef.current?.currentTime || 0;
          setCurrent(t);
          onTimeUpdate?.(t);
        }}
        onLoadedMetadata={() => {
          const d = videoRef.current?.duration;
          if (d && isFinite(d)) setDuration(d);
        }}
        onDurationChange={() => {
          const d = videoRef.current?.duration;
          if (d && isFinite(d)) setDuration(d);
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setCurrent(0);
          setCtrlVis(true);
          if (videoRef.current) videoRef.current.currentTime = 0;
        }}
        playsInline
      />

      {/* Center play button */}
      {!playing && (
        <button
          onClick={toggle}
          className="absolute inset-0 flex items-center justify-center group/play"
        >
          <div
            className="w-[72px] h-[72px] rounded-full bg-white/10 border border-white/20 backdrop-blur-sm
            flex items-center justify-center transition-all duration-200
            group-hover/play:bg-white/20 group-hover/play:scale-105 active:scale-95"
          >
            <Play size={26} className="text-white ml-1" fill="currentColor" />
          </div>
        </button>
      )}

      {/* Controls overlay */}
      <div
        className={`absolute bottom-0 inset-x-0 transition-all duration-300
        ${ctrlVis || !playing ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      >
        <div className="bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-14 pb-5 px-5">
          {/* Seek bar */}
          <div
            ref={trackRef}
            onClick={seek}
            className="h-[3px] bg-white/20 rounded-full cursor-pointer mb-4 group/seek"
          >
            <div
              className="h-full bg-white rounded-full relative transition-all"
              style={{ width: `${pct}%` }}
            >
              <div
                className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white
                opacity-0 group-hover/seek:opacity-100 transition-opacity shadow-md"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggle}
              className="text-white/80 hover:text-white transition-colors"
            >
              {playing ? (
                <Pause size={18} />
              ) : (
                <Play size={18} fill="currentColor" />
              )}
            </button>
            <span className="text-[12px] text-white/50 font-mono tabular-nums">
              {formatDuration(current)} /{" "}
              {duration > 0 ? formatDuration(duration) : "Loading…"}
            </span>
            <button
              onClick={() => {
                const m = !muted;
                setMuted(m);
                if (videoRef.current) videoRef.current.muted = m;
              }}
              className="text-white/40 hover:text-white/80 transition-colors"
            >
              {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <div className="flex-1" />
            <select
              className="text-white/60 text-[12px] rounded-[8px] px-2.5 py-1.5 cursor-pointer"
              style={{
                background: "rgba(255,255,255,.1)",
                border: "none",
                outline: "none",
              }}
              onChange={(e) => {
                if (videoRef.current)
                  videoRef.current.playbackRate = parseFloat(e.target.value);
              }}
            >
              <option value="1">1x</option>
              <option value="1.25">1.25x</option>
              <option value="1.5">1.5x</option>
              <option value="2">2x</option>
            </select>
            <button
              onClick={() => {
                if (document.fullscreenElement) document.exitFullscreen();
                else videoRef.current?.requestFullscreen?.();
              }}
              className="text-white/40 hover:text-white/80 transition-colors"
            >
              <Maximize size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Comments Sidebar
   ══════════════════════════════════════════════════════════════ */
function CommentsSidebar({ currentTime }) {
  const [text, setText] = useState("");
  const [comments, setComments] = useState([]);

  const send = () => {
    if (!text.trim()) return;
    setComments((c) => [
      ...c,
      {
        id: Date.now(),
        name: "You",
        time: Math.floor(currentTime),
        text: text.trim(),
      },
    ]);
    setText("");
  };

  return (
    <aside className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div
        className="flex items-center gap-2.5 px-6 py-5 shrink-0"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <MessageCircle size={16} style={{ color: "var(--text-3)" }} />
        <span
          className="text-[15px] font-semibold"
          style={{ color: "var(--text-1)" }}
        >
          Comments
        </span>
      </div>

      {/* Compose */}
      <div
        className="px-5 py-4 shrink-0"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div
          className="rounded-[14px] p-3.5 transition-colors"
          style={{
            border: "1px solid var(--border)",
            background: "var(--bg-soft)",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--purple-border)";
            e.currentTarget.style.background = "white";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.background = "var(--bg-soft)";
          }}
        >
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send();
            }}
            placeholder={`Leave a comment at ${formatDuration(currentTime)}…`}
            className="w-full bg-transparent text-[13px] placeholder:opacity-50
              resize-none outline-none leading-relaxed"
            style={{ color: "var(--text-1)" }}
          />
          <div className="flex items-center justify-between mt-2.5">
            <span
              className="text-[12px] font-medium"
              style={{ color: "var(--purple)" }}
            >
              Timestamp: {formatDuration(currentTime)}
            </span>
            <button
              onClick={send}
              disabled={!text.trim()}
              className="pill-btn text-[12px] font-semibold px-3.5 py-1.5
                disabled:opacity-40 disabled:pointer-events-none"
              style={{ background: "var(--text-1)", color: "white" }}
            >
              <Send size={11} /> Send
            </button>
          </div>
        </div>
      </div>

      {/* Comments list */}
      <div className="flex-1 overflow-y-auto px-5">
        {comments.length === 0 && (
          <p
            className="text-[12px] text-center py-10"
            style={{ color: "var(--text-3)" }}
          >
            No comments yet.
          </p>
        )}
        {comments.map((c) => (
          <div
            key={c.id}
            className="py-4"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <div className="flex justify-between items-baseline mb-2">
              <span
                className="text-[13px] font-semibold"
                style={{ color: "var(--text-1)" }}
              >
                {c.name}
              </span>
              <span
                className="text-[12px] font-mono tabular-nums"
                style={{ color: "var(--text-3)" }}
              >
                {formatDuration(c.time)}
              </span>
            </div>
            <p
              className="text-[13px] leading-relaxed"
              style={{ color: "var(--text-2)" }}
            >
              {c.text}
            </p>
          </div>
        ))}
      </div>
    </aside>
  );
}

/* ══════════════════════════════════════════════════════════════
   Screenshots Panel (sidebar bottom)
   ══════════════════════════════════════════════════════════════ */
function ScreenshotsPanel() {
  const { screenshots, openScreenshotPreview } = useRecorderStore();
  if (!screenshots.length) return null;
  return (
    <div
      className="px-5 py-5 shrink-0"
      style={{ borderTop: "1px solid var(--border)" }}
    >
      <div className="flex items-center gap-2 mb-3.5">
        <ImageIcon size={13} style={{ color: "var(--text-3)" }} />
        <span
          className="text-[11px] font-semibold uppercase tracking-[0.08em]"
          style={{ color: "var(--text-3)" }}
        >
          Screenshots ({screenshots.length})
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {screenshots.map((shot) => (
          <button
            key={shot.id}
            onClick={() => openScreenshotPreview(shot.id)}
            className="group relative rounded-[12px] overflow-hidden aspect-video transition-colors"
            style={{
              border: "1px solid var(--border)",
              background: "var(--bg-soft)",
            }}
          >
            <img
              src={shot.url}
              alt="screenshot"
              className="w-full h-full object-cover"
            />
            <div
              className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100
              transition-opacity flex items-center justify-center"
            >
              <span className="text-[11px] text-white font-medium">View</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   PreviewPage — Main layout
   ══════════════════════════════════════════════════════════════ */
export function PreviewPage() {
  const {
    recordedBlob,
    recordedUrl,
    recordedMimeType,
    elapsedSeconds,
    recordingResolution,
    mode,
    reset,
    recordingState,
    uploadProgress,
    shareLink,
  } = useRecorderStore();
  const { upload } = useUpload();

  const [title, setTitle] = useState(() => {
    const d = new Date();
    return `Recording – ${d.toLocaleDateString()} at ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  });
  const [editTitle, setEditTitle] = useState(false);
  const [playerTime, setPlayerTime] = useState(0);
  const [copied, setCopied] = useState(false);
  const [privacy, setPrivacy] = useState("Unlisted");

  if (!recordedUrl) return null;

  const ext = recordedMimeType?.includes("mp4") ? "mp4" : "webm";
  const modeLabel = MODE_LABEL[mode] || "Recording";
  const isUploading = recordingState === RECORDING_STATE.UPLOADING;
  const isUploaded = recordingState === RECORDING_STATE.UPLOADED;

  const copyLink = () => {
    const link = shareLink?.shareUrl || window.location.href;
    navigator.clipboard?.writeText(link).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="min-h-screen flex flex-col anim-fade-in"
      style={{ background: "var(--bg)" }}
    >
      {/* ── Navbar ── */}
      <header
        className="h-[60px] shrink-0 flex items-center justify-between px-6 md:px-8
        bg-white/80 backdrop-blur-md sticky top-0 z-50"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mr-2">
            <div
              className="w-7 h-7 rounded-[8px] flex items-center justify-center"
              style={{
                background: "var(--purple)",
                boxShadow: "var(--shadow-purple)",
              }}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-white/90" />
            </div>
            <span
              className="text-[14px] font-bold tracking-[-0.02em]"
              style={{ color: "var(--text-1)" }}
            >
              Recrd
            </span>
          </div>

          <button
            onClick={reset}
            className="flex items-center gap-2 text-[13px] transition-colors"
            style={{ color: "var(--text-3)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--text-1)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--text-3)")
            }
          >
            <ArrowLeft size={15} /> New recording
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="badge badge-green">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Ready
          </span>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT — Video + Actions */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[860px] mx-auto px-6 md:px-8 py-8">
            {/* Title */}
            <div className="flex items-start justify-between gap-4 mb-2">
              <div className="flex-1 min-w-0">
                {editTitle ? (
                  <input
                    autoFocus
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={() => setEditTitle(false)}
                    onKeyDown={(e) => e.key === "Enter" && setEditTitle(false)}
                    className="w-full text-[24px] font-bold bg-transparent outline-none pb-1"
                    style={{
                      color: "var(--text-1)",
                      borderBottom: "2px solid var(--purple)",
                    }}
                  />
                ) : (
                  <button
                    onClick={() => setEditTitle(true)}
                    className="group flex items-center gap-2.5 text-left"
                  >
                    <h1
                      className="text-[24px] font-bold truncate"
                      style={{ color: "var(--text-1)" }}
                    >
                      {title}
                    </h1>
                    <Edit3
                      size={15}
                      className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1"
                      style={{ color: "var(--text-3)" }}
                    />
                  </button>
                )}
                <p
                  className="text-[13px] mt-2"
                  style={{ color: "var(--text-3)" }}
                >
                  <span
                    className="font-medium"
                    style={{ color: "var(--purple)" }}
                  >
                    Recorded by you
                  </span>
                  {" · "}
                  {formatDuration(elapsedSeconds)}
                  {recordingResolution && ` · ${recordingResolution}`}
                  {" · "}
                  {modeLabel}
                </p>
              </div>
            </div>

            {/* Player */}
            <div className="mt-6">
              <InlinePlayer src={recordedUrl} onTimeUpdate={setPlayerTime} />
            </div>

            {/* Action buttons — Loom pill style */}
            <div className="flex flex-wrap items-center gap-2.5 mt-5">
              <button onClick={copyLink} className="pill-btn pill-btn-primary">
                {copied ? (
                  <>
                    <Check size={15} /> Copied!
                  </>
                ) : (
                  <>
                    <Link2 size={15} /> Copy link
                  </>
                )}
              </button>

              <button
                onClick={() =>
                  downloadBlob(recordedBlob, generateFilename("recording", ext))
                }
                className="pill-btn pill-btn-outline"
              >
                <Download size={15} /> Download {ext.toUpperCase()}
              </button>

              <button
                onClick={() =>
                  setPrivacy((p) =>
                    p === "Unlisted"
                      ? "Private"
                      : p === "Private"
                        ? "Public"
                        : "Unlisted",
                  )
                }
                className="pill-btn pill-btn-outline"
              >
                <Lock size={15} /> {privacy}
              </button>

              <div className="flex-1" />

              {isUploaded ? (
                <span
                  className="pill-btn"
                  style={{
                    background: "#ecfdf5",
                    color: "#059669",
                    border: "1px solid #a7f3d0",
                  }}
                >
                  <Check size={15} /> Uploaded
                </span>
              ) : isUploading ? (
                <div className="flex flex-col gap-1.5 min-w-[200px]">
                  <div
                    className="flex items-center gap-2 text-[13px]"
                    style={{ color: "var(--text-2)" }}
                  >
                    <Loader2
                      size={14}
                      className="animate-spin text-[#7c3aed]"
                    />
                    Uploading… {uploadProgress}%
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden bg-[#f1f1f5]">
                    <div
                      className="h-full rounded-full transition-all duration-300 bg-[#7c3aed]"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-[#8c8ca3]">
                    Don't close this tab
                  </p>
                </div>
              ) : (
                <button
                  onClick={() => upload(title)}
                  className="pill-btn pill-btn-purple"
                >
                  <Upload size={15} /> Upload video
                </button>
              )}
            </div>

            {/* Details card */}
            <div className="surface-card p-6 mt-8">
              <h3
                className="text-[14px] font-semibold mb-5"
                style={{ color: "var(--text-1)" }}
              >
                Recording details
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
                <Detail
                  label="Duration"
                  value={formatDuration(elapsedSeconds)}
                />
                <Detail
                  label="File size"
                  value={formatFileSize(recordedBlob?.size)}
                />
                <Detail label="Format" value={ext.toUpperCase()} />
                {recordingResolution && (
                  <Detail label="Resolution" value={recordingResolution} />
                )}
              </div>
              <p
                className="text-[12px] mt-5 pt-5 leading-relaxed"
                style={{
                  borderTop: "1px solid var(--border)",
                  color: "var(--text-3)",
                }}
              >
                Upload uses a mock Cloudflare Stream API. Replace the{" "}
                <code
                  className="font-mono px-1.5 py-0.5 rounded-[6px]"
                  style={{
                    background: "var(--bg-subtle)",
                    color: "var(--text-2)",
                  }}
                >
                  TODO
                </code>{" "}
                blocks in{" "}
                <code
                  className="font-mono px-1.5 py-0.5 rounded-[6px]"
                  style={{
                    background: "var(--bg-subtle)",
                    color: "var(--text-2)",
                  }}
                >
                  cloudflareService.js
                </code>
                .
              </p>
            </div>

            {/* Delete */}
            <button
              onClick={reset}
              className="flex items-center gap-2 text-[13px] mt-6 transition-colors"
              style={{ color: "var(--text-3)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#dc2626")}
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--text-3)")
              }
            >
              <Trash2 size={14} /> Delete this recording
            </button>
          </div>
        </div>

        {/* RIGHT — Sidebar */}
        <div
          className="w-[340px] shrink-0 flex flex-col overflow-hidden bg-white hidden md:flex"
          style={{ borderLeft: "1px solid var(--border)" }}
        >
          <CommentsSidebar currentTime={playerTime} />
          <ScreenshotsPanel />
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <div
        className="text-[11px] font-semibold uppercase tracking-[0.08em] mb-1.5"
        style={{ color: "var(--text-3)" }}
      >
        {label}
      </div>
      <div className="text-[16px] font-bold" style={{ color: "var(--text-1)" }}>
        {value}
      </div>
    </div>
  );
}
