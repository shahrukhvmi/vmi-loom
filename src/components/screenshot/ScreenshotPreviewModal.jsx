import { useEffect, useState } from "react";
import {
  Download,
  Trash2,
  X,
  Copy,
  Check,
  ZoomIn,
  ZoomOut,
  Edit2,
} from "lucide-react";
import { useRecorderStore } from "../../context/recorderStore";
import { useScreenshot } from "../../hooks/useScreenshot";
import { ScreenshotEditor } from "./ScreenshotEditor";

export function ScreenshotPreviewModal() {
  const {
    screenshots,
    screenshotPreviewId,
    closeScreenshotPreview,
    removeScreenshot,
  } = useRecorderStore();
  const { downloadScreenshot, copyScreenshot } = useScreenshot();

  const [copied, setCopied] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [editing, setEditing] = useState(false);

  const shot = screenshots.find((s) => s.id === screenshotPreviewId);

  useEffect(() => {
    setCopied(false);
    setZoomed(false);
    setEditing(false);
  }, [screenshotPreviewId]);

  useEffect(() => {
    if (!screenshotPreviewId) return;
    const handler = (e) => {
      if (e.key === "Escape" && !editing) closeScreenshotPreview();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [screenshotPreviewId, closeScreenshotPreview, editing]);

  if (!screenshotPreviewId || !shot) return null;

  const handleCopy = async () => {
    const ok = await copyScreenshot(shot);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDelete = () => {
    URL.revokeObjectURL(shot.url);
    removeScreenshot(shot.id);
    closeScreenshotPreview();
  };

  const sizeKB = shot.blob ? Math.round(shot.blob.size / 1024) : 0;

  // Show editor
  if (editing) {
    return (
      <ScreenshotEditor
        imageUrl={shot.url}
        blob={shot.blob}
        onClose={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-5">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[8px] anim-fade-in"
        onClick={closeScreenshotPreview}
      />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-4xl anim-modal-in flex flex-col"
        style={{ maxHeight: "calc(100vh - 48px)" }}
      >
        <div
          className="bg-white rounded-[24px] border border-[#ebebf0] overflow-hidden flex flex-col"
          style={{ boxShadow: "0 16px 48px rgba(0,0,0,.14)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 shrink-0 border-b border-[#ebebf0]">
            <div>
              <h2 className="text-[16px] font-semibold text-[#1a1a2e]">
                Screenshot captured
              </h2>
              <p className="text-[12px] mt-1 text-[#8c8ca3]">
                {shot.capturedAt?.toLocaleTimeString?.() || ""} · {sizeKB} KB ·
                PNG
              </p>
            </div>
            <button
              onClick={closeScreenshotPreview}
              className="w-9 h-9 rounded-[10px] flex items-center justify-center text-[#8c8ca3]
                hover:bg-[#f8f8fa] hover:text-[#1a1a2e] transition-colors cursor-pointer"
            >
              <X size={17} />
            </button>
          </div>

          {/* Image */}
          <div
            className="relative overflow-auto flex items-center justify-center bg-[#f8f8fa]"
            style={{ minHeight: 300, maxHeight: "calc(100vh - 240px)" }}
          >
            <img
              src={shot.url}
              alt="Screenshot"
              onClick={() => setZoomed(!zoomed)}
              className="block transition-all duration-300"
              style={{
                maxWidth: zoomed ? "none" : "100%",
                maxHeight: zoomed ? "none" : "65vh",
                cursor: zoomed ? "zoom-out" : "zoom-in",
                borderRadius: 6,
                margin: zoomed ? 0 : "16px",
              }}
            />
            <button
              onClick={() => setZoomed(!zoomed)}
              className="absolute top-4 right-4 p-2 rounded-[10px] backdrop-blur-sm shadow-sm cursor-pointer"
              style={{
                background: "rgba(255,255,255,.85)",
                border: "1px solid #ebebf0",
                color: "#555570",
              }}
            >
              {zoomed ? <ZoomOut size={15} /> : <ZoomIn size={15} />}
            </button>
          </div>

          {/* Actions */}
          <div className="px-6 py-5 flex flex-wrap items-center gap-2.5 shrink-0 border-t border-[#ebebf0] bg-white">
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-semibold
                bg-[#7c3aed] hover:bg-[#6d28d9] text-white transition-all active:scale-95 cursor-pointer"
              style={{ boxShadow: "0 4px 14px rgba(124,58,237,.25)" }}
            >
              <Edit2 size={15} /> Edit
            </button>

            <button
              onClick={() => downloadScreenshot(shot)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-medium
                bg-white border border-[#ebebf0] text-[#555570] hover:border-[#d4c5fd] hover:text-[#7c3aed]
                transition-all cursor-pointer shadow-sm"
            >
              <Download size={15} /> Download
            </button>

            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-medium
                bg-white border border-[#ebebf0] text-[#555570] hover:border-[#d4c5fd] hover:text-[#7c3aed]
                transition-all cursor-pointer shadow-sm"
            >
              {copied ? (
                <>
                  <Check size={15} className="text-green-500" /> Copied!
                </>
              ) : (
                <>
                  <Copy size={15} /> Copy
                </>
              )}
            </button>

            <div className="flex-1" />

            <button
              onClick={handleDelete}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-medium
                bg-[#fef2f2] border border-[#fecaca] text-[#dc2626] hover:bg-[#fee2e2]
                transition-all cursor-pointer"
            >
              <Trash2 size={15} /> Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
