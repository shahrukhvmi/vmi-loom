import { useState, useRef, useCallback, useEffect } from "react";
import Hls from "hls.js";
import {
  Download,
  Trash2,
  ArrowLeft,
  Link2,
  Lock,
  Globe,
  EyeOff,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Check,
  Upload,
  Loader2,
  Edit3,
  Save,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { useRecorderStore } from "../context/recorderStore";
import { videoService } from "../services/authService";
import { useAuthStore } from "../context/authStore";
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

const PRIVACY_OPTIONS = [
  { value: "private", label: "Private", icon: Lock },
  { value: "unlisted", label: "Unlisted", icon: EyeOff },
  { value: "public", label: "Public", icon: Globe },
];

/* ── Speed Select ───────────────────────────────────────────────────────── */
function SpeedSelect({ videoRef }) {
  const [speed, setSpeed] = useState(1);
  const [open, setOpen] = useState(false);
  const speeds = [0.5, 1, 1.25, 1.5, 2];

  const handleSelect = (s) => {
    setSpeed(s);
    setOpen(false);
    if (videoRef.current) videoRef.current.playbackRate = s;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-white/60 hover:text-white/90 text-[12px] rounded-[8px]
          px-2.5 py-1.5 cursor-pointer transition-colors"
        style={{ background: "rgba(255,255,255,0.1)" }}
      >
        {speed}x
      </button>
      {open && (
        <div
          className="absolute bottom-full mb-2 right-0 rounded-[10px] overflow-hidden z-50"
          style={{
            background: "#1a1a2e",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          }}
        >
          {speeds.map((s) => (
            <button
              key={s}
              onClick={() => handleSelect(s)}
              className="w-full px-4 py-2 text-[12px] text-left cursor-pointer transition-colors block"
              style={{
                color: speed === s ? "#a78bfa" : "rgba(255,255,255,0.7)",
                background:
                  speed === s ? "rgba(124,58,237,0.2)" : "transparent",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.08)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background =
                  speed === s ? "rgba(124,58,237,0.2)" : "transparent")
              }
            >
              {s}x
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Inline Video Player ───────────────────────────────────────────────── */
function InlinePlayer({ src, onTimeUpdate }) {
  const videoRef = useRef(null);
  const trackRef = useRef(null);
  const hideTimer = useRef(null);
  const hlsRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [ctrlVis, setCtrlVis] = useState(true);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !src) return;

    // Destroy previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    setPlaying(false);
    setCurrent(0);
    setDuration(0);

    const isHls = src.includes(".m3u8");
    if (isHls && Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(v);
      hlsRef.current = hls;
    } else if (isHls && v.canPlayType("application/vnd.apple.mpegurl")) {
      v.src = src;
      v.load(); // Safari native HLS
    } else {
      v.src = src;
      v.load(); // blob URL
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
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
      style={{ aspectRatio: "16/9", borderRadius: "16px" }}
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

      <div
        className={`absolute bottom-0 inset-x-0 transition-all duration-300
        ${ctrlVis || !playing ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      >
        <div className="bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-14 pb-5 px-5">
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
            <SpeedSelect videoRef={videoRef} />
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

/* ── Comments Sidebar ───────────────────────────────────────────────────── */
function CommentsSidebar({ currentTime, videoUuid }) {
  const { user } = useAuthStore();
  const [text, setText] = useState("");
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // Fetch comments on mount
  useEffect(() => {
    if (!videoUuid) return;
    setLoading(true);
    videoService
      .getComments(videoUuid)
      .then((res) => {
        const data = res.data?.data;
        // API returns { data: { comments: [...] } }
        const list =
          data?.comments || data?.data || (Array.isArray(data) ? data : []);
        setComments(list);
      })
      .catch((e) => console.error("[getComments]", e))
      .finally(() => setLoading(false));
  }, [videoUuid]);

  const send = async () => {
    if (!text.trim() || !videoUuid) return;
    setSending(true);
    try {
      const res = await videoService.createComment(
        videoUuid,
        user?.name || "Anonymous",
        text.trim(),
        Math.floor(currentTime),
      );
      // API returns the new comment object — ensure it's not nested
      // Response: { data: { comment: {...} } }
      const newComment = res.data?.data?.comment || {
        id: Date.now(),
        guest_name: user?.name || "Anonymous",
        comment: text.trim(),
        timestamp_seconds: Math.floor(currentTime),
        created_at: new Date().toISOString(),
      };
      setComments((c) => [...c, newComment]);
      setText("");
    } catch (e) {
      console.error("[createComment]", e);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-[#ebebf0] shrink-0">
        <span className="text-[15px] font-semibold text-[#1a1a2e]">
          Comments
        </span>
        {comments.length > 0 && (
          <span className="text-[12px] text-[#8c8ca3]">{comments.length}</span>
        )}
      </div>

      {/* Compose */}
      <div className="px-5 py-4 shrink-0 border-b border-[#ebebf0]">
        <div
          className="rounded-[14px] p-3.5 border border-[#ebebf0] bg-[#f8f8fa]
          focus-within:border-[#7c3aed] focus-within:bg-white transition-all"
        >
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send();
            }}
            rows={3}
            placeholder={`Comment at ${formatDuration(Math.floor(currentTime))}…`}
            className="w-full bg-transparent text-[13px] text-[#1a1a2e] placeholder:text-[#8c8ca3]
              resize-none outline-none leading-relaxed"
          />
          <div className="flex items-center justify-between mt-2.5">
            <span className="text-[12px] font-medium text-[#7c3aed]">
              ⏱ {formatDuration(Math.floor(currentTime))}
            </span>
            <button
              onClick={send}
              disabled={!text.trim() || sending}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px]
                font-semibold bg-[#1a1a2e] text-white disabled:opacity-40 disabled:pointer-events-none
                transition-all active:scale-95 cursor-pointer"
            >
              {sending ? (
                <Loader2 size={11} className="animate-spin" />
              ) : (
                "Send"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Comments list */}
      <div className="flex-1 overflow-y-auto px-5">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 size={18} className="animate-spin text-[#7c3aed]" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-[12px] text-center text-[#8c8ca3] py-10">
            No comments yet.
          </p>
        ) : (
          comments.map((c, i) => (
            <div key={c.id || i} className="py-4 border-b border-[#ebebf0]">
              <div className="flex justify-between items-baseline mb-1.5">
                <span className="text-[13px] font-semibold text-[#1a1a2e]">
                  {c.guest_name || c.name || "Anonymous"}
                </span>
                <span className="text-[12px] font-mono text-[#8c8ca3]">
                  {formatDuration(c.timestamp_seconds || c.time || 0)}
                </span>
              </div>
              <p className="text-[13px] text-[#555570] leading-relaxed">
                {c.comment || c.text}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ── Editable field ────────────────────────────────────────────────────── */
function EditableField({ label, value, multiline, onSave, saving }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || "");

  useEffect(() => {
    setDraft(value || "");
  }, [value]);

  const save = async () => {
    await onSave(draft);
    setEditing(false);
  };
  const cancel = () => {
    setDraft(value || "");
    setEditing(false);
  };

  const isTitle = label === "Title";

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8c8ca3]">
          {label}
        </span>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1 text-[11px] text-[#7c3aed] hover:underline"
          >
            <Edit3 size={11} /> Edit
          </button>
        )}
      </div>
      {editing ? (
        <div className="flex flex-col gap-2">
          {multiline ? (
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-[13px] rounded-[10px] border border-[#7c3aed] bg-white
                outline-none resize-none text-[#1a1a2e] leading-relaxed"
              style={{ boxShadow: "0 0 0 3px rgba(124,58,237,.1)" }}
            />
          ) : (
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="w-full px-3 py-2 text-[13px] rounded-[10px] border border-[#7c3aed] bg-white
                outline-none text-[#1a1a2e]"
              style={{ boxShadow: "0 0 0 3px rgba(124,58,237,.1)" }}
            />
          )}
          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-medium
                bg-[#7c3aed] text-white disabled:opacity-50"
            >
              {saving ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Save size={12} />
              )}
              Save
            </button>
            <button
              onClick={cancel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px]
                bg-[#f8f8fa] border border-[#ebebf0] text-[#555570]"
            >
              <X size={12} /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <p
          className={
            isTitle
              ? "text-[28px] font-bold text-[#1a1a2e] tracking-[-0.02em] leading-tight"
              : "text-[14px] text-[#1a1a2e] leading-relaxed"
          }
        >
          {value || (
            <span className="text-[#8c8ca3] italic text-[14px] font-normal">
              Not set
            </span>
          )}
        </p>
      )}
    </div>
  );
}

/* ── PreviewPage ───────────────────────────────────────────────────────── */
export function PreviewPage({ serverVideo, onBack }) {
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
    uploadedRecord,
  } = useRecorderStore();

  // Server video mode — from library (only uuid passed, fetch full data)
  const isServerVideo = !!serverVideo;
  const [serverVideoData, setServerVideoData] = useState(null);
  const [serverLoading, setServerLoading] = useState(false);
  const [serverShareUrl, setServerShareUrl] = useState("");

  useEffect(() => {
    if (!serverVideo?.uuid) return;
    setServerLoading(true);
    videoService
      .getVideo(serverVideo.uuid)
      .then((res) => {
        const v = res.data?.data?.video;
        const rawUrl = res.data?.data?.share_url || "";
        // Replace backend localhost:3000 with current app origin
        const shareUrl = rawUrl.replace(
          /https?:\/\/localhost:\d+/,
          window.location.origin,
        );
        setServerVideoData(v);
        setServerShareUrl(shareUrl);
        setTitle(v?.title || "");
        setDescription(v?.description || "");
        setPrivacy(v?.privacy || "private");
      })
      .catch((e) => console.error("[getVideo]", e))
      .finally(() => setServerLoading(false));
  }, [serverVideo?.uuid]);

  const activeServerVideo = serverVideoData;
  const videoSrc = isServerVideo
    ? activeServerVideo?.playback_url
    : recordedUrl;

  const [title, setTitle] = useState(() => {
    const d = new Date();
    return `Recording – ${d.toLocaleDateString()} at ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  });
  const [description, setDescription] = useState("");
  const [privacy, setPrivacy] = useState("private");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [playerTime, setPlayerTime] = useState(0);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const privacyRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (privacyRef.current && !privacyRef.current.contains(e.target)) {
        setPrivacyOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const ext = isServerVideo
    ? "mp4"
    : recordedMimeType?.includes("mp4")
      ? "mp4"
      : "webm";
  const modeLabel = isServerVideo
    ? activeServerVideo?.duration_seconds
      ? `${activeServerVideo.duration_seconds}s`
      : "Video"
    : MODE_LABEL[mode] || "Recording";
  const isUploading = recordingState === RECORDING_STATE.UPLOADING;
  const isUploaded = recordingState === RECORDING_STATE.UPLOADED;
  const videoUuid = serverVideo?.uuid || uploadedRecord?.videoUuid;

  const patchVideo = async (fields) => {
    // No uuid yet (upload pending) — skip API silently
    if (!videoUuid) return;
    setSaving(true);
    try {
      await videoService.updateVideo(videoUuid, fields);
      toast.success("Saved");
    } catch (e) {
      console.error("[patchVideo]", e?.response?.data || e.message);
      toast.error(e?.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!videoUuid) {
      reset?.();
      onBack?.();
      return;
    }
    setDeleteLoading(true);
    try {
      console.log("[delete] hitting API for uuid:", videoUuid);
      await videoService.deleteVideo(videoUuid);
      toast.success("Video deleted");
      setShowDeleteConfirm(false);
      if (onBack) onBack();
      else reset?.();
    } catch (e) {
      console.error("[delete error]", e?.response?.status, e?.response?.data);
      toast.error(e?.response?.data?.message || "Failed to delete");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleTitleSave = async (val) => {
    setTitle(val);
    await patchVideo({ title: val });
  };

  const handleDescSave = async (val) => {
    setDescription(val);
    await patchVideo({ description: val });
  };

  const handlePrivacyChange = async (val) => {
    setPrivacy(val);
    await patchVideo({ privacy: val });
  };

  const copyLink = () => {
    const link = isServerVideo
      ? serverShareUrl || window.location.href
      : shareLink?.shareUrl || window.location.href;
    navigator.clipboard?.writeText(link).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isServerVideo && serverLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f8fa]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={28} className="animate-spin text-[#7c3aed]" />
          <p className="text-[13px] text-[#8c8ca3]">Loading video…</p>
        </div>
      </div>
    );
  }
  if (!isServerVideo && !recordedUrl) return null;

  const PrivacyIcon =
    PRIVACY_OPTIONS.find((p) => p.value === privacy)?.icon || Lock;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Navbar */}
      <header
        className="h-[60px] shrink-0 flex items-center justify-between px-8
        bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-[#ebebf0]"
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5 mr-2">
            <div
              className="w-7 h-7 rounded-[8px] bg-[#7c3aed] flex items-center justify-center"
              style={{ boxShadow: "0 4px 14px rgba(124,58,237,.3)" }}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-white/90" />
            </div>
            <span className="text-[14px] font-bold tracking-[-0.02em] text-[#1a1a2e]">
              Recrd
            </span>
          </div>
          <button
            onClick={isServerVideo ? onBack : reset}
            className="flex items-center gap-2 text-[13px] text-[#8c8ca3] hover:text-[#1a1a2e] transition-colors"
          >
            <ArrowLeft size={15} />{" "}
            {isServerVideo ? "Back to library" : "New recording"}
          </button>
        </div>
        <span
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5
          rounded-full bg-[#ecfdf5] border border-[#a7f3d0] text-[#059669]"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Ready
        </span>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[860px] mx-auto px-6 md:px-8 py-8">
            {/* Title — editable */}
            <EditableField
              label="Title"
              value={title}
              onSave={handleTitleSave}
              saving={saving}
            />

            <p className="text-[13px] text-[#8c8ca3] mt-2 mb-6">
              <span className="font-medium text-[#7c3aed]">
                Recorded by you
              </span>
              {" · "}
              {isServerVideo
                ? formatDuration(activeServerVideo?.duration_seconds || 0)
                : formatDuration(elapsedSeconds)}
              {isServerVideo
                ? activeServerVideo?.size_bytes
                  ? ` · ${formatFileSize(activeServerVideo.size_bytes)}`
                  : " · 0 B"
                : recordingResolution
                  ? ` · ${recordingResolution}`
                  : ""}
              {" · "}
              {modeLabel}
            </p>

            {/* Player */}
            <InlinePlayer src={videoSrc} onTimeUpdate={setPlayerTime} />

            {/* Action pills */}
            <div className="flex flex-wrap items-center gap-2.5 mt-5">
              {/* Copy link */}
              {isServerVideo ? (
                serverShareUrl ? (
                  <button
                    onClick={copyLink}
                    className="inline-flex items-center gap-2 px-5 py-2.5
                    rounded-full text-[13px] font-semibold bg-[#1a1a2e] hover:bg-[#2a2a42]
                    text-white transition-all active:scale-95 cursor-pointer"
                  >
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
                ) : (
                  <div
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px]
                    bg-[#f8f8fa] text-[#8c8ca3] border border-[#ebebf0]"
                  >
                    <Link2 size={15} /> No share link
                  </div>
                )
              ) : !isServerVideo && shareLink ? (
                <button
                  onClick={copyLink}
                  className="inline-flex items-center gap-2 px-5 py-2.5
                  rounded-full text-[13px] font-semibold bg-[#1a1a2e] hover:bg-[#2a2a42]
                  text-white transition-all active:scale-95"
                >
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
              ) : isUploaded ? (
                <div
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px]
                  bg-[#f0ecfe] text-[#7c3aed] border border-[#d4c5fd] cursor-wait"
                >
                  <Loader2 size={14} className="animate-spin" /> Creating link…
                </div>
              ) : (
                <div
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px]
                  bg-[#f8f8fa] text-[#8c8ca3] border border-[#ebebf0] cursor-not-allowed"
                >
                  <Link2 size={15} /> Link pending upload
                </div>
              )}

              {/* Download */}
              {isServerVideo ? (
                activeServerVideo?.download_url && (
                  <a
                    href={activeServerVideo?.download_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-medium
                      bg-white border border-[#ebebf0] text-[#555570] hover:border-[#d4c5fd] hover:text-[#7c3aed]
                      transition-all shadow-sm"
                  >
                    <Download size={15} /> Download MP4
                  </a>
                )
              ) : (
                <button
                  onClick={() =>
                    downloadBlob(
                      recordedBlob,
                      generateFilename("recording", "mp4"),
                    )
                  }
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-medium
                    bg-white border border-[#ebebf0] text-[#555570] hover:border-[#d4c5fd] hover:text-[#7c3aed]
                    transition-all active:scale-95 shadow-sm"
                >
                  <Download size={15} /> Download MP4
                </button>
              )}

              {/* Privacy dropdown — hover with invisible bridge so cursor doesn't lose it */}
              <div className="relative group/privacy">
                <button
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-medium
                  bg-white border border-[#ebebf0] text-[#555570]
                  group-hover/privacy:border-[#d4c5fd] group-hover/privacy:text-[#7c3aed]
                  transition-all shadow-sm capitalize"
                >
                  <PrivacyIcon size={15} />
                  {PRIVACY_OPTIONS.find((p) => p.value === privacy)?.label}
                </button>
                {/* Invisible bridge fills the 8px gap so hover doesn't break */}
                <div className="absolute left-0 top-full w-full h-3 z-40" />
                <div
                  className="absolute left-0 top-full pt-3 w-44 z-50
                  opacity-0 pointer-events-none group-hover/privacy:opacity-100 group-hover/privacy:pointer-events-auto
                  transition-opacity duration-100"
                >
                  <div
                    className="bg-white border border-[#ebebf0] rounded-[12px] overflow-hidden"
                    style={{ boxShadow: "0 8px 24px rgba(0,0,0,.08)" }}
                  >
                    {PRIVACY_OPTIONS.map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        onClick={() => handlePrivacyChange(value)}
                        className={`w-full flex items-center gap-2.5 px-4 py-3 text-[13px] text-left
                          hover:bg-[#f8f8fa] transition-colors
                          ${privacy === value ? "text-[#7c3aed] font-medium" : "text-[#1a1a2e]"}`}
                      >
                        <Icon size={14} /> {label}
                        {privacy === value && (
                          <Check size={12} className="ml-auto text-[#7c3aed]" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex-1" />

              {/* Upload progress — only for fresh recordings */}
              {!isServerVideo && isUploading ? (
                <div className="flex flex-col gap-1.5 min-w-[200px]">
                  <div className="flex items-center gap-2 text-[13px] text-[#555570]">
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
              ) : isUploaded ? (
                <span
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px]
                  bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0]"
                >
                  <Check size={14} /> Uploaded
                </span>
              ) : null}
            </div>

            {/* Details card */}
            <div
              className="mt-8 p-6 rounded-[16px] border border-[#ebebf0]"
              style={{ boxShadow: "0 1px 3px rgba(0,0,0,.06)" }}
            >
              <h3 className="text-[14px] font-semibold text-[#1a1a2e] mb-5">
                Recording details
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 pb-5 mb-5 border-b border-[#ebebf0]">
                <Detail
                  label="Duration"
                  value={
                    isServerVideo
                      ? formatDuration(activeServerVideo?.duration_seconds || 0)
                      : formatDuration(elapsedSeconds)
                  }
                />
                <Detail
                  label="File size"
                  value={
                    isServerVideo
                      ? formatFileSize(activeServerVideo?.size_bytes || 0)
                      : formatFileSize(recordedBlob?.size)
                  }
                />
                <Detail label="Format" value={ext.toUpperCase()} />
                {!isServerVideo && recordingResolution && (
                  <Detail label="Resolution" value={recordingResolution} />
                )}
              </div>

              {/* Description — editable */}
              <EditableField
                label="Description"
                value={description}
                multiline
                onSave={handleDescSave}
                saving={saving}
              />
            </div>

            {/* Delete */}
            {/* Delete button */}
            <div className="mt-6">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-[10px] text-[13px] font-medium
                  text-[#dc2626] border border-[#fecaca] bg-[#fef2f2]
                  hover:bg-[#fee2e2] transition-all cursor-pointer"
              >
                <Trash2 size={14} /> Delete video
              </button>
            </div>

            {/* Delete confirm modal */}
            {showDeleteConfirm && (
              <div className="fixed inset-0 z-[99999] flex items-center justify-center p-5">
                <div
                  className="absolute inset-0 bg-black/30 backdrop-blur-[4px]"
                  onClick={() => !deleteLoading && setShowDeleteConfirm(false)}
                />
                <div
                  className="relative z-10 w-full max-w-[380px] bg-white rounded-[20px] p-6 anim-modal-in"
                  style={{ boxShadow: "0 16px 48px rgba(0,0,0,.14)" }}
                >
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-[14px] bg-[#fef2f2] flex items-center justify-center mb-4">
                    <Trash2 size={22} className="text-[#dc2626]" />
                  </div>
                  <h3 className="text-[17px] font-bold text-[#1a1a2e] mb-2">
                    Delete this video?
                  </h3>
                  <p className="text-[13px] text-[#555570] leading-relaxed mb-6">
                    This action cannot be undone. The video will be permanently
                    deleted from your library.
                  </p>
                  <div className="flex gap-2.5">
                    <button
                      onClick={handleDelete}
                      disabled={deleteLoading}
                      className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-[12px]
                        text-[14px] font-semibold bg-[#dc2626] hover:bg-[#b91c1c] text-white
                        disabled:opacity-50 transition-all cursor-pointer"
                    >
                      {deleteLoading ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />{" "}
                          Deleting…
                        </>
                      ) : (
                        <>
                          <Trash2 size={14} /> Delete
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={deleteLoading}
                      className="flex-1 py-2.5 rounded-[12px] text-[14px] font-medium
                        border border-[#ebebf0] text-[#555570] hover:bg-[#f8f8fa]
                        disabled:opacity-50 transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT Sidebar */}
        <div className="w-[320px] shrink-0 hidden md:flex flex-col bg-white border-l border-[#ebebf0]">
          <CommentsSidebar currentTime={playerTime} videoUuid={videoUuid} />
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8c8ca3] mb-1.5">
        {label}
      </div>
      <div className="text-[16px] font-bold text-[#1a1a2e]">{value}</div>
    </div>
  );
}
