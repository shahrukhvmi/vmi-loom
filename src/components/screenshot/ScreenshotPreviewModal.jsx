import { useEffect } from 'react';
import { Download, Trash2, X, Copy, Check, Upload, ZoomIn, ZoomOut } from 'lucide-react';
import { useState } from 'react';
import { useRecorderStore } from '../../context/recorderStore';
import { useScreenshot } from '../../hooks/useScreenshot';
import { generateFilename } from '../../utils';

/**
 * Full-screen screenshot preview modal — opens automatically after every capture.
 * Shows: the captured image, file info, and action buttons (Download, Copy, Delete, Upload).
 */
export function ScreenshotPreviewModal() {
  const { screenshots, screenshotPreviewId, closeScreenshotPreview, removeScreenshot } = useRecorderStore();
  const { downloadScreenshot, copyScreenshot } = useScreenshot();

  const [copied,   setCopied]   = useState(false);
  const [zoomed,   setZoomed]   = useState(false);
  const [uploading,setUploading]= useState(false);
  const [uploaded, setUploaded] = useState(false);

  const shot = screenshots.find((s) => s.id === screenshotPreviewId);

  // Reset states when a new screenshot opens
  useEffect(() => {
    setCopied(false);
    setZoomed(false);
    setUploading(false);
    setUploaded(false);
  }, [screenshotPreviewId]);

  // Keyboard: Esc to close
  useEffect(() => {
    if (!screenshotPreviewId) return;
    const handler = (e) => { if (e.key === 'Escape') closeScreenshotPreview(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [screenshotPreviewId, closeScreenshotPreview]);

  if (!screenshotPreviewId || !shot) return null;

  const handleCopy = async () => {
    const ok = await copyScreenshot(shot);
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  const handleDelete = () => {
    URL.revokeObjectURL(shot.url);
    removeScreenshot(shot.id);
    closeScreenshotPreview();
  };

  // Mock upload
  const handleUpload = async () => {
    setUploading(true);
    await new Promise((r) => setTimeout(r, 1800));
    setUploading(false);
    setUploaded(true);
  };

  const sizeKB = shot.blob ? Math.round(shot.blob.size / 1024) : 0;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[6px] anim-fade-in"
        onClick={closeScreenshotPreview}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-4xl anim-modal-in flex flex-col"
        style={{ maxHeight: 'calc(100vh - 40px)' }}>
        <div className="surface-modal overflow-hidden flex flex-col">

          {/* ── Header ── */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] shrink-0">
            <div>
              <h2 className="text-[15px] font-semibold text-[var(--text-1)]">Screenshot captured</h2>
              <p className="text-[12px] text-[var(--text-3)] mt-0.5">
                {shot.capturedAt?.toLocaleTimeString?.() || ''} · {sizeKB} KB · PNG
              </p>
            </div>
            <button onClick={closeScreenshotPreview}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-3)]
                hover:bg-[var(--bg-soft)] hover:text-[var(--text-1)] transition-colors">
              <X size={16} />
            </button>
          </div>

          {/* ── Image ── */}
          <div className="relative bg-[var(--bg-soft)] overflow-auto flex items-center justify-center"
            style={{ minHeight: 300, maxHeight: 'calc(100vh - 220px)' }}>
            <img
              src={shot.url}
              alt="Screenshot"
              onClick={() => setZoomed(!zoomed)}
              className="block transition-all duration-300"
              style={{
                maxWidth:  zoomed ? 'none'  : '100%',
                maxHeight: zoomed ? 'none'  : '65vh',
                cursor:    zoomed ? 'zoom-out' : 'zoom-in',
                borderRadius: 4,
              }}
            />
            {/* Zoom hint */}
            <button onClick={() => setZoomed(!zoomed)}
              className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/80 backdrop-blur-sm
                border border-[var(--border)] text-[var(--text-2)] hover:bg-white transition-colors shadow-sm">
              {zoomed ? <ZoomOut size={14} /> : <ZoomIn size={14} />}
            </button>
          </div>

          {/* ── Actions ── */}
          <div className="px-5 py-4 border-t border-[var(--border)] flex flex-wrap items-center gap-2.5 shrink-0 bg-white">

            {/* Download */}
            <button onClick={() => downloadScreenshot(shot)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium
                bg-[var(--purple)] hover:bg-[#6d28d9] text-white shadow-sm transition-all active:scale-95">
              <Download size={14} />
              Download PNG
            </button>

            {/* Copy */}
            <button onClick={handleCopy}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium
                bg-white border border-[var(--border)] hover:border-[var(--purple-border)]
                text-[var(--text-2)] hover:text-[var(--purple)] transition-all active:scale-95 shadow-sm">
              {copied ? <><Check size={14} className="text-green-500" /> Copied!</> : <><Copy size={14} /> Copy image</>}
            </button>

            {/* Upload (mock) */}
            {uploaded ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium
                bg-green-50 border border-green-200 text-green-700">
                <Check size={14} /> Uploaded
              </div>
            ) : (
              <button onClick={handleUpload} disabled={uploading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium
                  bg-white border border-[var(--border)] hover:border-[var(--purple-border)]
                  text-[var(--text-2)] hover:text-[var(--purple)] transition-all active:scale-95 shadow-sm
                  disabled:opacity-50">
                {uploading
                  ? <><svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Uploading…</>
                  : <><Upload size={14} /> Upload</>}
              </button>
            )}

            <div className="flex-1" />

            {/* Delete */}
            <button onClick={handleDelete}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium
                text-red-500 hover:bg-red-50 border border-transparent hover:border-red-200
                transition-all active:scale-95">
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
