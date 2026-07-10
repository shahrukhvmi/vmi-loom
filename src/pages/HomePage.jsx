import { useState } from 'react';
import { Monitor, Camera, Layers, Crop, Maximize, ChevronRight, ImageIcon } from 'lucide-react';
import { useRecorderStore } from '../context/recorderStore';
import { useScreenshot } from '../hooks/useScreenshot';
import { Button } from '../components/ui/Button';

const MODES = [
  { icon: Monitor, label: 'Screen',         desc: 'Capture any window, tab, or full display' },
  { icon: Camera,  label: 'Camera',         desc: 'Record yourself with your webcam' },
  { icon: Layers,  label: 'Screen + Camera',desc: 'Overlay your camera on a screen recording' },
];

export function HomePage() {
  const { openLauncher } = useRecorderStore();
  const { captureFullScreen, captureArea } = useScreenshot();
  const [shotMenu, setShotMenu] = useState(false);
  const [loading,  setLoading]  = useState(false);

  const takeShot = async (mode) => {
    setShotMenu(false);
    setLoading(true);
    try {
      if (mode === 'area') await captureArea();
      else                 await captureFullScreen();
    } catch {}
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">

      {/* ── Nav ── */}
      <header className="h-14 flex items-center justify-between px-6 border-b border-[var(--border)] shrink-0 bg-white">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[var(--purple)] flex items-center justify-center shadow-sm">
            <div className="w-2.5 h-2.5 rounded-full bg-white" />
          </div>
          <span className="text-[15px] font-bold text-[var(--text-1)] tracking-tight">Recrd</span>
        </div>

        <nav className="flex items-center gap-1.5">
          {/* Screenshot dropdown */}
          <div className="relative">
            <Button variant="ghost" size="sm" onClick={() => setShotMenu(!shotMenu)} disabled={loading}>
              {loading
                ? <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                : <ImageIcon size={14} />}
              Screenshot
            </Button>
            {shotMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-[var(--border)]
                rounded-xl shadow-lg overflow-hidden z-50 anim-scale-in">
                <button onClick={() => takeShot('full')}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-[var(--text-1)]
                    hover:bg-[var(--bg-soft)] transition-colors text-left">
                  <Maximize size={14} className="text-[var(--text-3)]" />
                  Full screen
                </button>
                <button onClick={() => takeShot('area')}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-[var(--text-1)]
                    hover:bg-[var(--bg-soft)] transition-colors text-left border-t border-[var(--border)]">
                  <Crop size={14} className="text-[var(--text-3)]" />
                  Selected area
                </button>
                <div className="border-t border-[var(--border)]" />
                <button onClick={() => setShotMenu(false)}
                  className="w-full px-3.5 py-2 text-[11px] text-[var(--text-3)] hover:bg-[var(--bg-soft)] transition-colors text-left">
                  Press Esc to cancel after capture
                </button>
              </div>
            )}
          </div>

          <Button variant="primary" size="sm" onClick={openLauncher}>
            <span className="w-2 h-2 rounded-full bg-white/80" />
            Record
          </Button>
        </nav>
      </header>

      {/* ── Hero ── */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-[640px] mx-auto text-center space-y-10 anim-fade-up">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 text-[11px] font-semibold px-3.5 py-1.5
            rounded-full bg-[var(--purple-soft)] border border-[var(--purple-border)] text-[var(--purple)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--purple)]" />
            Browser-native · No extension needed
          </div>

          {/* Headline */}
          <div className="space-y-4">
            <h1 className="text-[46px] font-bold tracking-[-0.03em] leading-[1.1] text-[var(--text-1)]">
              Record anything,{' '}
              <span className="grad-text">instantly</span>
            </h1>
            <p className="text-[16px] text-[var(--text-2)] leading-relaxed max-w-md mx-auto">
              Screen, camera, or both — with microphone, system audio, and area screenshots.
              Runs entirely in your browser.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Button variant="primary" size="lg" onClick={openLauncher} className="px-6 shadow-md shadow-purple-200">
              <span className="w-2 h-2 rounded-full bg-white/80" />
              Start recording
              <ChevronRight size={15} className="opacity-70" />
            </Button>
            <div className="relative">
              <Button variant="secondary" size="lg" onClick={() => setShotMenu(!shotMenu)}>
                <ImageIcon size={15} />
                Screenshot
              </Button>
            </div>
          </div>
        </div>

        {/* Mode cards */}
        <div className="grid grid-cols-3 gap-3 max-w-[640px] w-full mt-14 anim-fade-up"
          style={{ animationDelay: '80ms' }}>
          {MODES.map(({ icon: Icon, label, desc }) => (
            <button key={label} onClick={openLauncher}
              className="group text-left p-4 rounded-2xl border border-[var(--border)]
                hover:border-[var(--purple-border)] hover:bg-[var(--purple-soft)]
                bg-[var(--bg-soft)] transition-all duration-200
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/40">
              <div className="w-8 h-8 rounded-xl mb-3 flex items-center justify-center
                bg-white border border-[var(--border)] text-[var(--text-2)]
                group-hover:bg-[var(--purple)] group-hover:text-white group-hover:border-[var(--purple)]
                transition-all duration-200 shadow-sm">
                <Icon size={16} />
              </div>
              <div className="text-[13px] font-semibold text-[var(--text-1)] mb-1">{label}</div>
              <div className="text-[11px] text-[var(--text-3)] leading-relaxed">{desc}</div>
            </button>
          ))}
        </div>

        <p className="mt-10 text-[11px] text-[var(--text-3)] text-center anim-fade-up" style={{ animationDelay:'160ms' }}>
          Recordings stay in browser memory until you download or upload them.
        </p>
      </main>
    </div>
  );
}
