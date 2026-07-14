import { useState, useEffect, useCallback } from "react";
import {
  Video,
  Clock,
  Globe,
  EyeOff,
  Lock,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Plus,
  Library,
  LogOut,
} from "lucide-react";
import toast from "react-hot-toast";
import { videoService, authService } from "../services/authService";
import { useAuthStore } from "../context/authStore";

const PRIVACY_FILTERS = [
  { value: "", label: "All" },
  { value: "public", label: "Public" },
  { value: "unlisted", label: "Unlisted" },
  { value: "private", label: "Private" },
];

const PRIVACY_ICON = {
  public: Globe,
  unlisted: EyeOff,
  private: Lock,
};

function formatDur(s) {
  if (!s) return null;
  const m = Math.floor(s / 60),
    sec = Math.floor(s % 60);
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function formatSize(b) {
  if (!b) return "";
  if (b >= 1e6) return `${(b / 1e6).toFixed(1)} MB`;
  return `${(b / 1e3).toFixed(0)} KB`;
}

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function VideoCard({ video, onClick }) {
  const PrivacyIcon = PRIVACY_ICON[video.privacy] || Lock;
  const dur = formatDur(video.duration_seconds);

  return (
    <button
      onClick={() => onClick(video)}
      className="group text-left w-full rounded-[16px] overflow-hidden
        border border-[#ebebf0] bg-white transition-all duration-200 cursor-pointer"
      style={{ boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,.12)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,.06)")
      }
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-[#1a1a2e] overflow-hidden">
        {video.thumbnail_url ? (
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Video size={32} className="text-white/20" />
          </div>
        )}
        {dur && (
          <div
            className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-[6px]
            text-[11px] font-semibold text-white font-mono"
            style={{
              background: "rgba(0,0,0,0.72)",
              backdropFilter: "blur(4px)",
            }}
          >
            {dur}
          </div>
        )}
        {video.status !== "ready" && (
          <div
            className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full
            text-[10px] font-semibold text-white capitalize"
            style={{ background: "rgba(0,0,0,0.6)" }}
          >
            {video.status}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3
          className="text-[14px] font-semibold text-[#1a1a2e] truncate mb-1.5
          group-hover:text-[#7c3aed] transition-colors"
        >
          {video.title || "Untitled"}
        </h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[12px] text-[#8c8ca3]">
            <Clock size={11} />
            {timeAgo(video.created_at)}
            {video.size_bytes && (
              <span className="text-[#c8c8d5]">
                · {formatSize(video.size_bytes)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-[#8c8ca3] capitalize">
            <PrivacyIcon size={11} />
            {video.privacy}
          </div>
        </div>
      </div>
    </button>
  );
}

export function LibraryPage({ onNewRecording, onVideoSelect }) {
  const { clearAuth } = useAuthStore();
  const [allVideos, setAllVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [privacy, setPrivacy] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {}
    clearAuth();
    toast.success("Logged out");
  };

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await videoService.getVideos(page);
      setAllVideos(res.data?.data?.data || []);
      setMeta(res.data?.data?.meta || null);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load videos");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  // Client-side filter by privacy field
  const videos = privacy
    ? allVideos.filter((v) => v.privacy === privacy)
    : allVideos;

  return (
    <div className="min-h-screen bg-[#f8f8fa]">
      {/* Navbar */}
      <header
        className="h-[60px] flex items-center justify-between px-8
        bg-white border-b border-[#ebebf0] sticky top-0 z-50"
      >
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-[10px] bg-[#7c3aed] flex items-center justify-center"
              style={{ boxShadow: "0 4px 14px rgba(124,58,237,.3)" }}
            >
              <div className="w-3 h-3 rounded-full bg-white/90" />
            </div>
            <span className="text-[16px] font-bold tracking-[-0.02em] text-[#1a1a2e]">
              Record
            </span>
          </div>
          <nav className="flex items-center gap-1">
            <button
              onClick={onNewRecording}
              className="flex items-center gap-2 px-3.5 py-2 rounded-[10px] text-[13px]
                text-[#555570] hover:bg-[#f8f8fa] hover:text-[#1a1a2e] transition-colors cursor-pointer"
            >
              <Video size={15} /> Recorder
            </button>
            <button
              className="flex items-center gap-2 px-3.5 py-2 rounded-[10px] text-[13px]
              font-medium text-[#7c3aed] bg-[#f0ecfe] cursor-pointer"
            >
              <Library size={15} /> Library
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onNewRecording}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-[13px]
              font-semibold bg-[#7c3aed] hover:bg-[#6d28d9] text-white transition-all
              active:scale-95 cursor-pointer"
            style={{ boxShadow: "0 4px 14px rgba(124,58,237,.25)" }}
          >
            <Plus size={15} /> New recording
          </button>
          <button
            onClick={handleLogout}
            title="Logout"
            className="w-9 h-9 flex items-center justify-center rounded-[10px] cursor-pointer
              text-[#8c8ca3] hover:bg-[#f8f8fa] hover:text-[#dc2626] transition-all"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <div className="max-w-[1100px] mx-auto px-6 md:px-8 py-8">
        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[12px] text-[#8c8ca3] mb-1">Library</p>
            <h1 className="text-[28px] font-bold text-[#1a1a2e] tracking-[-0.02em]">
              My Videos
            </h1>
          </div>
          {meta && (
            <span className="text-[13px] text-[#8c8ca3]">
              {meta.total} total
            </span>
          )}
        </div>

        {/* Privacy Filter pills */}
        <div className="flex items-center gap-2 mb-6">
          {PRIVACY_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setPrivacy(f.value)}
              className={`px-4 py-2 rounded-full text-[13px] font-medium transition-all cursor-pointer
                ${
                  privacy === f.value
                    ? "bg-[#7c3aed] text-white"
                    : "bg-white border border-[#ebebf0] text-[#555570] hover:border-[#d4c5fd] hover:text-[#7c3aed]"
                }`}
            >
              {f.label}
              {f.value && !loading && (
                <span
                  className={`ml-1.5 text-[11px] ${privacy === f.value ? "opacity-70" : "text-[#8c8ca3]"}`}
                >
                  {allVideos.filter((v) => v.privacy === f.value).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={28} className="animate-spin text-[#7c3aed]" />
              <p className="text-[13px] text-[#8c8ca3]">Loading videos…</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3 text-center">
              <AlertCircle size={28} className="text-[#dc2626]" />
              <p className="text-[14px] font-medium text-[#1a1a2e]">{error}</p>
              <button
                onClick={fetchVideos}
                className="text-[13px] text-[#7c3aed] hover:underline cursor-pointer"
              >
                Try again
              </button>
            </div>
          </div>
        ) : videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-[20px] bg-[#f0ecfe] flex items-center justify-center">
              <Video size={28} className="text-[#7c3aed]" />
            </div>
            <div className="text-center">
              <p className="text-[15px] font-semibold text-[#1a1a2e] mb-1">
                {privacy ? `No ${privacy} videos` : "No videos yet"}
              </p>
              <p className="text-[13px] text-[#8c8ca3]">
                {privacy
                  ? "Try a different filter"
                  : "Record your first video to get started"}
              </p>
            </div>
            {!privacy && (
              <button
                onClick={onNewRecording}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px]
                  font-semibold bg-[#7c3aed] text-white hover:bg-[#6d28d9] transition-all cursor-pointer"
                style={{ boxShadow: "0 4px 14px rgba(124,58,237,.25)" }}
              >
                <Plus size={15} /> New recording
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {videos.map((v) => (
                <VideoCard key={v.uuid} video={v} onClick={onVideoSelect} />
              ))}
            </div>

            {/* Pagination — only show when no filter active */}
            {!privacy && meta && meta.last_page > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 1}
                  className="w-9 h-9 flex items-center justify-center rounded-[10px]
                    border border-[#ebebf0] bg-white text-[#555570]
                    hover:border-[#d4c5fd] hover:text-[#7c3aed]
                    disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>

                {Array.from({ length: meta.last_page }, (_, i) => i + 1).map(
                  (p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-9 h-9 flex items-center justify-center rounded-[10px]
                      text-[13px] font-medium transition-all border cursor-pointer
                      ${
                        page === p
                          ? "bg-[#7c3aed] text-white border-[#7c3aed]"
                          : "bg-white text-[#555570] border-[#ebebf0] hover:border-[#d4c5fd] hover:text-[#7c3aed]"
                      }`}
                    >
                      {p}
                    </button>
                  ),
                )}

                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page === meta.last_page}
                  className="w-9 h-9 flex items-center justify-center rounded-[10px]
                    border border-[#ebebf0] bg-white text-[#555570]
                    hover:border-[#d4c5fd] hover:text-[#7c3aed]
                    disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
