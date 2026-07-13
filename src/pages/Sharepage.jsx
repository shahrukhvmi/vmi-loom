import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { Download, Loader2, AlertCircle } from "lucide-react";
import { videoService } from "../services/authService";

export function SharePage({ shareUuid }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [polling, setPolling] = useState(false);

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

      // If still processing, poll every 3s
      if (v?.status !== "ready" || !v?.playback_url) {
        setPolling(true);
        setTimeout(fetchVideo, 3000);
      } else {
        setPolling(false);
      }
    } catch (e) {
      setError(e?.response?.data?.message || "Video not found");
    } finally {
      setLoading(false);
    }
  };

  // Setup HLS when playback_url is available
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || !video?.playback_url) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(video.playback_url);
      hls.attachMedia(videoEl);
      hlsRef.current = hls;
    } else if (videoEl.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari native HLS
      videoEl.src = video.playback_url;
    }

    return () => {
      hlsRef.current?.destroy();
    };
  }, [video?.playback_url]);

  const formatDur = (s) => {
    if (!s) return "--:--";
    const m = Math.floor(s / 60),
      sec = Math.floor(s % 60);
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const formatSize = (b) => {
    if (!b) return "";
    if (b > 1e6) return `${(b / 1e6).toFixed(1)} MB`;
    return `${(b / 1e3).toFixed(0)} KB`;
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading && !video) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f8fa]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={32} className="animate-spin text-[#7c3aed]" />
          <p className="text-[14px] text-[#8c8ca3]">Loading video…</p>
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f8fa]">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircle size={32} className="text-[#dc2626]" />
          <p className="text-[15px] font-semibold text-[#1a1a2e]">
            Video not found
          </p>
          <p className="text-[13px] text-[#8c8ca3]">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f8fa]">
      {/* Navbar */}
      <header className="h-[60px] flex items-center px-8 bg-white border-b border-[#ebebf0] sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-[10px] bg-[#7c3aed] flex items-center justify-center"
            style={{ boxShadow: "0 4px 14px rgba(124,58,237,.3)" }}
          >
            <div className="w-3 h-3 rounded-full bg-white/90" />
          </div>
          <span className="text-[16px] font-bold tracking-[-0.02em] text-[#1a1a2e]">
            Recrd
          </span>
        </div>
      </header>

      <div className="max-w-[860px] mx-auto px-6 py-8">
        {/* Title */}
        <h1 className="text-[24px] font-bold text-[#1a1a2e] tracking-[-0.02em] mb-1">
          {video?.title || "Recording"}
        </h1>
        <p className="text-[13px] text-[#8c8ca3] mb-6">
          {formatDur(video?.duration_seconds)}
          {video?.size_bytes ? ` · ${formatSize(video.size_bytes)}` : ""}
          {video?.status === "ready" ? " · Ready" : " · Processing…"}
        </p>

        {/* Player */}
        {video?.status === "ready" && video?.playback_url ? (
          <div
            className="rounded-[16px] overflow-hidden bg-black"
            style={{
              aspectRatio: "16/9",
              boxShadow: "0 8px 32px rgba(0,0,0,.12)",
            }}
          >
            <video
              ref={videoRef}
              controls
              className="w-full h-full"
              playsInline
            />
          </div>
        ) : (
          /* Processing state */
          <div
            className="rounded-[16px] bg-[#1a1a2e] flex flex-col items-center justify-center gap-4"
            style={{ aspectRatio: "16/9" }}
          >
            {video?.thumbnail_url && (
              <img
                src={video.thumbnail_url}
                alt="thumbnail"
                className="absolute inset-0 w-full h-full object-cover opacity-30 rounded-[16px]"
              />
            )}
            <Loader2 size={36} className="animate-spin text-white/60" />
            <div className="text-center">
              <p className="text-white/80 text-[15px] font-medium">
                Processing video…
              </p>
              <p className="text-white/40 text-[12px] mt-1">
                {video?.processing_percentage || 0}% complete
              </p>
            </div>
            {/* Processing progress bar */}
            <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#7c3aed] rounded-full transition-all duration-500"
                style={{ width: `${video?.processing_percentage || 0}%` }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        {video?.download_url && (
          <div className="flex items-center gap-3 mt-5">
            <a
              href={video.download_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-medium
                bg-white border border-[#ebebf0] text-[#555570] hover:border-[#d4c5fd] hover:text-[#7c3aed]
                transition-all shadow-sm"
            >
              <Download size={15} /> Download MP4
            </a>
          </div>
        )}

        {/* Thumbnail */}
        {video?.thumbnail_url && video?.status === "ready" && (
          <div className="mt-8 surface-card p-5">
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#8c8ca3] mb-3">
              Thumbnail
            </p>
            <img
              src={video.thumbnail_url}
              alt="thumbnail"
              className="rounded-[10px] max-w-[240px]"
            />
          </div>
        )}
      </div>
    </div>
  );
}
