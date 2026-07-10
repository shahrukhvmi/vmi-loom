import { useState } from "react";
import {
  Monitor,
  Camera,
  Layers,
  Crop,
  Maximize,
  ChevronRight,
  ImageIcon,
} from "lucide-react";
import { useRecorderStore } from "../context/recorderStore";
import { useScreenshot } from "../hooks/useScreenshot";
import { Button } from "../components/ui/Button";

const MODES = [
  {
    icon: Monitor,
    label: "Screen",
    desc: "Capture any window, tab, or your full display",
    mode: "screen",
  },
  {
    icon: Camera,
    label: "Camera",
    desc: "Record yourself with your webcam",
    mode: "camera",
  },
  {
    icon: Layers,
    label: "Screen + Camera",
    desc: "Overlay your camera on a screen recording",
    mode: "screen+camera",
  },
];

export function HomePage() {
  const { openLauncher, setMode } = useRecorderStore();
  const { captureFullScreen, captureArea } = useScreenshot();
  const [shotMenu, setShotMenu] = useState(false);
  const [loading, setLoading] = useState(false);

  const takeShot = async (mode) => {
    setShotMenu(false);
    setLoading(true);
    try {
      if (mode === "area") await captureArea();
      else await captureFullScreen();
    } catch {}
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* ── Navbar ── */}
      <header className="h-[60px] flex items-center justify-between px-8 border-b border-[#ebebf0] shrink-0 bg-white sticky top-0 z-50">
        {/* Logo */}
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

        {/* Nav actions */}
        <nav className="flex items-center gap-2">
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShotMenu(!shotMenu)}
              disabled={loading}
            >
              {loading ? (
                <svg
                  className="animate-spin h-3.5 w-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              ) : (
                <ImageIcon size={15} />
              )}
              Screenshot
            </Button>
            {shotMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-[#ebebf0] rounded-[12px] shadow-lg overflow-hidden z-50 anim-scale-in">
                <button
                  onClick={() => takeShot("full")}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-[13px] text-[#1a1a2e] hover:bg-[#f8f8fa] transition-colors text-left"
                >
                  <Maximize size={15} className="text-[#8c8ca3]" />
                  Full screen
                </button>
                <button
                  onClick={() => takeShot("area")}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-[13px] text-[#1a1a2e] hover:bg-[#f8f8fa] transition-colors text-left border-t border-[#ebebf0]"
                >
                  <Crop size={15} className="text-[#8c8ca3]" />
                  Selected area
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
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-24">
        <div className="w-full max-w-[640px] mx-auto text-center anim-fade-up">
          {/* Badge */}
          <div className="mb-8">
            <span
              className="inline-flex items-center gap-2 text-[11px] font-semibold px-4 py-2
              rounded-full bg-[#f0ecfe] border border-[#d4c5fd] text-[#7c3aed]"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#7c3aed]" />
              Browser-native · No extension needed
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-[48px] font-bold tracking-[-0.035em] leading-[1.1] text-[#1a1a2e] mb-5">
            Record anything, <span className="grad-text">instantly</span>
          </h1>

          <p className="text-[17px] leading-[1.7] text-[#555570] max-w-[460px] mx-auto mb-10">
            Screen, camera, or both — with microphone, system audio, and area
            screenshots. Runs entirely in your browser.
          </p>

          {/* CTA Buttons */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={openLauncher}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-[15px] font-semibold
                bg-[#7c3aed] hover:bg-[#6d28d9] text-white transition-all active:scale-95 cursor-pointer"
              style={{ boxShadow: "0 4px 14px rgba(124,58,237,.35)" }}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-white/80" />
              Start recording
              <ChevronRight size={16} className="opacity-70" />
            </button>

            <div className="relative">
              <button
                onClick={() => setShotMenu(!shotMenu)}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-[15px] font-medium
                  bg-white border border-[#ebebf0] text-[#555570] hover:border-[#d4c5fd] hover:text-[#7c3aed]
                  transition-all active:scale-95 shadow-sm cursor-pointer"
              >
                <ImageIcon size={16} />
                Screenshot
              </button>
            </div>
          </div>
        </div>

        {/* ── Mode Cards ── */}
        <div
          className="grid grid-cols-3 gap-4 max-w-[680px] w-full mt-16 anim-fade-up"
          style={{ animationDelay: "100ms" }}
        >
          {MODES.map(({ icon: Icon, label, desc, mode }) => (
            <button
              key={label}
              onClick={() => {
                setMode(mode);
                openLauncher();
              }}
              className="group text-left p-6 rounded-[18px] border border-[#ebebf0] bg-[#f8f8fa]
                hover:border-[#d4c5fd] hover:bg-[#f0ecfe]
                transition-all duration-200 cursor-pointer
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/40"
            >
              <div
                className="w-10 h-10 rounded-xl mb-4 flex items-center justify-center
                bg-white border border-[#ebebf0] text-[#555570]
                group-hover:bg-[#7c3aed] group-hover:text-white group-hover:border-[#7c3aed]
                transition-all duration-200 shadow-sm"
              >
                <Icon size={18} />
              </div>

              <div className="text-[14px] font-semibold text-[#1a1a2e] mb-1.5">
                {label}
              </div>
              <div className="text-[12px] text-[#8c8ca3] leading-relaxed">
                {desc}
              </div>
            </button>
          ))}
        </div>

        <p
          className="mt-10 text-[12px] text-[#8c8ca3] anim-fade-up"
          style={{ animationDelay: "200ms" }}
        >
          Recordings stay in browser memory until you download or upload them.
        </p>
      </main>
    </div>
  );
}
