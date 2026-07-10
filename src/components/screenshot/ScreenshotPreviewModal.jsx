import { useEffect, useState } from 'react';
import { Download, Trash2, X, Copy, Check, Upload, ZoomIn, ZoomOut } from 'lucide-react';
import { useRecorderStore } from '../../context/recorderStore';
import { useScreenshot } from '../../hooks/useScreenshot';

export function ScreenshotPreviewModal() {
  const { screenshots, screenshotPreviewId, closeScreenshotPreview, removeScreenshot } = useRecorderStore();
  const { downloadScreenshot, copyScreenshot } = useScreenshot();

  const [copied,    setCopied]    = useState(false);
  const [zoomed,    setZoomed]    = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploaded,  setUploaded]  = useState(false);

  const shot = screenshots.find((s) => s.id === screenshotPreviewId);

  useEffect(() => {
    setCopied(false); setZoomed(false); setUploading(false); setUploaded(false);
  }, [screenshotPreviewId]);

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

  const handleUpload = async () => {
    setUploading(true);
    await new Promise((r) => setTimeout(r, 1800));
    setUploading(false);
    setUploaded(true);
  };

  const sizeKB = shot.blob ? Math.round(shot.blob.size / 1024) : 0;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-5">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[8px] anim-fade-in"
        onClick={closeScreenshotPreview} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-4xl anim-modal-in flex flex-col"
        style={{ maxHeight: 'calc(100vh - 48px)' }}>
        <div className="surface-modal overflow-hidden flex flex-col">

          {/* ── Header ── */}
          <div className="flex items-center justify-between px-6 py-5 shrink-0"
            style={{ borderBottom: '1px solid var(--border)' }}>
            <div>
              <h2 className="text-[16px] font-semibold" style={{ color: 'var(--text-1)' }}>
                Screenshot captured
              </h2>
              <p className="text-[12px] mt-1" style={{ color: 'var(--text-3)' }}>
                {shot.capturedAt?.toLocaleTimeString?.() || ''} · {sizeKB} KB · PNG
              </p>
            </div>
            <button onClick={closeScreenshotPreview}
              className="w-9 h-9 rounded-[10px] flex items-center justify-center transition-colors"
              style={{ color: 'var(--text-3)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-soft)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
              <X size={17} />
            </button>
          </div>

          {/* ── Image ── */}
          <div className="relative overflow-auto flex items-center justify-center"
            style={{ background: 'var(--bg-soft)', minHeight: 300, maxHeight: 'calc(100vh - 240px)' }}>
            <img src={shot.url} alt="Screenshot"
              onClick={() => setZoomed(!zoomed)}
              className="block transition-all duration-300"
              style={{
                maxWidth:  zoomed ? 'none'  : '100%',
                maxHeight: zoomed ? 'none'  : '65vh',
                cursor:    zoomed ? 'zoom-out' : 'zoom-in',
                borderRadius: 6,
                margin: zoomed ? 0 : '16px',
              }} />
            <button onClick={() => setZoomed(!zoomed)}
              className="absolute top-4 right-4 p-2 rounded-[10px] backdrop-blur-sm transition-colors shadow-sm"
              style={{
                background: 'rgba(255,255,255,.85)',
                border: '1px solid var(--border)',
                color: 'var(--text-2)',
              }}>
              {zoomed ? <ZoomOut size={15} /> : <ZoomIn size={15} />}
            </button>
          </div>

          {/* ── Actions ── */}
          <div className="px-6 py-5 flex flex-wrap items-center gap-2.5 shrink-0"
            style={{ borderTop: '1px solid var(--border)', background: 'white' }}>

            <button onClick={() => downloadScreenshot(shot)}
              className="pill-btn pill-btn-purple">
              <Download size={15} /> Download PNG
            </button>

            <button onClick={handleCopy} className="pill-btn pill-btn-outline">
              {copied ? <><Check size={15} className="text-green-500" /> Copied!</> : <><Copy size={15} /> Copy image</>}
            </button>

            {uploaded ? (
              <span className="pill-btn" style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>
                <Check size={15} /> Uploaded
              </span>
            ) : (
              <button onClick={handleUpload} disabled={uploading}
                className="pill-btn pill-btn-outline disabled:opacity-50">
                {uploading
                  ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg> Uploading…</>
                  : <><Upload size={15} /> Upload</>}
              </button>
            )}

            <div className="flex-1" />

            <button onClick={handleDelete} className="pill-btn pill-btn-danger">
              <Trash2 size={15} /> Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
