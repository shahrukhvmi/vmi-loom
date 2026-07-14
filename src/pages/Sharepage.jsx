import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import {
  Download,
  Loader2,
  AlertCircle,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  MessageCircle,
} from "lucide-react";
import { videoService } from "../services/authService";

function formatDur(s) {
  if (!s && s !== 0) return "--:--";
  const m = Math.floor(s / 60),
    sec = Math.floor(s % 60);
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}
function formatSize(b) {
  if (!b) return "";
  if (b > 1e6) return `${(b / 1e6).toFixed(1)} MB`;
  return `${(b / 1e3).toFixed(0)} KB`;
}
function clamp(v, min, max) {
  return Math.min(Math.max(v, min), max);
}

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
              className="w-full px-4 py-2 text-[12px] text-left cursor-pointer block"
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

/* ── HLS Player ─────────────────────────────────────────────────────────── */
function HlsPlayer({ src, onTimeUpdate, seekTo }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const trackRef = useRef(null);
  const hideTimer = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [ctrlVis, setCtrlVis] = useState(true);

  // Setup HLS
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !src) return;
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    setPlaying(false);
    setCurrent(0);
    setDuration(0);
    if (src.includes(".m3u8") && Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(v);
      hlsRef.current = hls;
    } else {
      v.src = src;
      v.load();
    }
    return () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [src]);

  // External seek (from comment timestamp click)
  useEffect(() => {
    if (seekTo === null || seekTo === undefined) return;
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = seekTo;
    v.play()
      .then(() => setPlaying(true))
      .catch(() => {});
  }, [seekTo]);

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

      {/* Center play */}
      {!playing && (
        <button
          onClick={toggle}
          className="absolute inset-0 flex items-center justify-center group/play"
        >
          <div
            className="w-[72px] h-[72px] rounded-full bg-white/10 border border-white/20 backdrop-blur-sm
            flex items-center justify-center transition-all group-hover/play:bg-white/20 group-hover/play:scale-105 active:scale-95"
          >
            <Play size={26} className="text-white ml-1" fill="currentColor" />
          </div>
        </button>
      )}

      {/* Controls */}
      <div
        className={`absolute bottom-0 inset-x-0 transition-all duration-300 ${ctrlVis || !playing ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      >
        <div className="bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-14 pb-5 px-5">
          <div
            ref={trackRef}
            onClick={seek}
            className="h-[3px] bg-white/20 rounded-full cursor-pointer mb-4 group/seek"
          >
            <div
              className="h-full bg-white rounded-full relative"
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
              className="text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              {playing ? (
                <Pause size={18} />
              ) : (
                <Play size={18} fill="currentColor" />
              )}
            </button>
            <span className="text-[12px] text-white/50 font-mono tabular-nums">
              {formatDur(current)} /{" "}
              {duration > 0 ? formatDur(duration) : "Loading…"}
            </span>
            <button
              onClick={() => {
                const m = !muted;
                setMuted(m);
                if (videoRef.current) videoRef.current.muted = m;
              }}
              className="text-white/40 hover:text-white/80 transition-colors cursor-pointer"
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
              className="text-white/40 hover:text-white/80 transition-colors cursor-pointer"
            >
              <Maximize size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Read-only Comments Sidebar ─────────────────────────────────────────── */
function CommentsSidebar({ videoUuid, onSeek }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!videoUuid) return;
    videoService
      .getComments(videoUuid)
      .then((res) => {
        const data = res.data?.data;
        const list =
          data?.comments || data?.data || (Array.isArray(data) ? data : []);
        setComments(list);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [videoUuid]);

  return (
    <aside className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-6 py-5 shrink-0 border-b border-[#ebebf0]">
        <MessageCircle size={15} className="text-[#8c8ca3]" />
        <span className="text-[15px] font-semibold text-[#1a1a2e]">
          Comments
        </span>
        {comments.length > 0 && (
          <span className="text-[12px] text-[#8c8ca3] ml-auto">
            {comments.length}
          </span>
        )}
      </div>

      {/* List */}
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
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-[13px] font-semibold text-[#1a1a2e]">
                  {c.guest_name || "Anonymous"}
                </span>
                {/* Clickable timestamp */}
                <button
                  onClick={() => onSeek?.(c.timestamp_seconds || 0)}
                  className="text-[12px] font-mono text-[#7c3aed] hover:underline cursor-pointer
                    hover:text-[#6d28d9] transition-colors font-medium"
                  title={`Jump to ${formatDur(c.timestamp_seconds || 0)}`}
                >
                  ⏱ {formatDur(c.timestamp_seconds || 0)}
                </button>
              </div>
              <p className="text-[13px] text-[#555570] leading-relaxed">
                {c.comment}
              </p>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}

/* ── SharePage ───────────────────────────────────────────────────────────── */
export function SharePage({ shareUuid, onBack }) {
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [seekTo, setSeekTo] = useState(null);

  useEffect(() => {
    if (!shareUuid) return;
    fetchVideo();
  }, [shareUuid]);

  const fetchVideo = async () => {
    try {
      setLoading(true);
      const res = await videoService.getVideo(shareUuid);
      const v = res.data?.data?.video;
      setVideo(v);
      if (v?.status !== "ready" || !v?.playback_url) {
        setTimeout(fetchVideo, 3000);
      }
    } catch (e) {
      setError(e?.response?.data?.message || "Video not found");
    } finally {
      setLoading(false);
    }
  };

  const handleSeek = (seconds) => {
    setSeekTo(null);
    setTimeout(() => setSeekTo(seconds), 0);
  };

  if (loading && !video) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f8fa]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={28} className="animate-spin text-[#7c3aed]" />
          <p className="text-[13px] text-[#8c8ca3]">Loading video…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f8fa]">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircle size={28} className="text-[#dc2626]" />
          <p className="text-[15px] font-semibold text-[#1a1a2e]">
            Video not found
          </p>
          <p className="text-[13px] text-[#8c8ca3]">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Navbar */}
      <header
        className="h-[60px] shrink-0 flex items-center justify-between px-8
        bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-[#ebebf0]"
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
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
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-[13px] text-[#8c8ca3] hover:text-[#1a1a2e] transition-colors cursor-pointer"
            >
              ← Back to library
            </button>
          )}
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[860px] mx-auto px-6 md:px-8 py-8">
            {/* Title */}
            <h1 className="text-[26px] font-bold text-[#1a1a2e] tracking-[-0.02em] mb-1">
              {video?.title || "Recording"}
            </h1>
            <p className="text-[13px] text-[#8c8ca3] mb-6">
              {formatDur(video?.duration_seconds)}
              {video?.size_bytes ? ` · ${formatSize(video.size_bytes)}` : ""}
            </p>

            {/* Player */}
            {video?.status === "ready" && video?.playback_url ? (
              <HlsPlayer src={video.playback_url} seekTo={seekTo} />
            ) : (
              <div
                className="rounded-[16px] bg-[#1a1a2e] relative flex flex-col items-center justify-center gap-4"
                style={{ aspectRatio: "16/9" }}
              >
                <Loader2 size={36} className="animate-spin text-white/60" />
                <div className="text-center">
                  <p className="text-white/80 text-[15px] font-medium">
                    Processing video…
                  </p>
                  <p className="text-white/40 text-[12px] mt-1">
                    {video?.processing_percentage || 0}% complete
                  </p>
                </div>
                <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#7c3aed] rounded-full transition-all duration-500"
                    style={{ width: `${video?.processing_percentage || 0}%` }}
                  />
                </div>
              </div>
            )}

            {/* Download */}
            {video?.download_url && (
              <div className="flex gap-3 mt-5">
                <a
                  href={video.download_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-medium
                    bg-white border border-[#ebebf0] text-[#555570] hover:border-[#d4c5fd] hover:text-[#7c3aed]
                    transition-all shadow-sm cursor-pointer"
                >
                  <Download size={15} /> Download MP4
                </a>
              </div>
            )}

            {/* Details */}
            <div
              className="mt-8 p-6 rounded-[16px] border border-[#ebebf0]"
              style={{ boxShadow: "0 1px 3px rgba(0,0,0,.06)" }}
            >
              <h3 className="text-[14px] font-semibold text-[#1a1a2e] mb-5">
                Video details
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                <Detail
                  label="Duration"
                  value={formatDur(video?.duration_seconds)}
                />
                {video?.size_bytes && (
                  <Detail
                    label="File size"
                    value={`${(video.size_bytes / 1e6).toFixed(1)} MB`}
                  />
                )}
                <Detail
                  label="Status"
                  value={video?.status === "ready" ? "Ready" : "Processing"}
                />
              </div>
              {video?.description && (
                <div className="mt-5 pt-5 border-t border-[#ebebf0]">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#8c8ca3] mb-2">
                    Description
                  </p>
                  <p className="text-[14px] text-[#555570] leading-relaxed">
                    {video.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT Sidebar — comments */}
        <div className="w-[320px] shrink-0 hidden md:flex flex-col bg-white border-l border-[#ebebf0]">
          <CommentsSidebar videoUuid={shareUuid} onSeek={handleSeek} />
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
