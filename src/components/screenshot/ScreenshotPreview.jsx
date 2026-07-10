import { Download, Trash2, ImageIcon, Clock } from 'lucide-react';
import { useRecorderStore } from '../../context/recorderStore';
import { useScreenshot } from '../../hooks/useScreenshot';
import { formatFileSize } from '../../utils';

export function ScreenshotPreview() {
  const { screenshots, removeScreenshot } = useRecorderStore();
  const { downloadScreenshot } = useScreenshot();

  if (screenshots.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <ImageIcon size={14} className="text-zinc-500" />
        <h3 className="text-sm font-medium text-zinc-400">
          Screenshots ({screenshots.length})
        </h3>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {screenshots.map((shot) => (
          <div
            key={shot.id}
            className="group relative rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900"
          >
            <img
              src={shot.url}
              alt="Screenshot"
              className="w-full aspect-video object-cover block"
            />

            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                onClick={() => downloadScreenshot(shot)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur text-white text-xs hover:bg-white/20 transition-colors"
              >
                <Download size={12} />
                Save
              </button>
              <button
                onClick={() => {
                  URL.revokeObjectURL(shot.url);
                  removeScreenshot(shot.id);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 backdrop-blur text-red-400 text-xs hover:bg-red-500/30 transition-colors"
              >
                <Trash2 size={12} />
                Delete
              </button>
            </div>

            {/* Timestamp */}
            <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5 bg-gradient-to-t from-black/70 to-transparent">
              <div className="flex items-center gap-1 text-xs text-zinc-400">
                <Clock size={10} />
                {shot.capturedAt?.toLocaleTimeString?.() || 'Now'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
