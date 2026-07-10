import { useEffect, useRef } from 'react';
import { Monitor, Camera, Layers, Mic, MicOff, Volume2, VolumeX, X } from 'lucide-react';
import { useRecorderStore } from '../../context/recorderStore';
import { useRecorder } from '../../hooks/useRecorder';
import { Button } from '../ui/Button';
import { Toggle } from '../ui/Toggle';
import { RECORDING_MODE } from '../../constants';
import { isSystemAudioLikelySupported } from '../../utils';
import { clsx } from 'clsx';

const MODES = [
  { key: RECORDING_MODE.SCREEN,        label: 'Screen',       icon: Monitor, desc: 'Full screen or window' },
  { key: RECORDING_MODE.CAMERA,        label: 'Camera',       icon: Camera,  desc: 'Webcam only' },
  { key: RECORDING_MODE.SCREEN_CAMERA, label: 'Screen + Cam', icon: Layers,  desc: 'Overlay camera' },
];

export function RecordingLauncher() {
  const {
    isLauncherOpen, closeLauncher,
    mode, setMode,
    micEnabled, toggleMic,
    systemAudioEnabled, toggleSystemAudio,
    error, clearError, recordingState,
  } = useRecorderStore();

  const { startRecording } = useRecorder();
  const isRequesting = recordingState === 'requesting';
  const systemAudioSupported = isSystemAudioLikelySupported();

  useEffect(() => {
    if (!isLauncherOpen) return;
    const fn = (e) => { if (e.key === 'Escape') closeLauncher(); };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [isLauncherOpen, closeLauncher]);

  if (!isLauncherOpen) return null;

  const handleStart = async () => { clearError(); closeLauncher(); await startRecording(); };

  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[4px] anim-fade-in" onClick={closeLauncher} />

      <div className="relative z-10 w-full max-w-[380px] anim-scale-in">
        <div className="surface-modal overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[var(--purple)] flex items-center justify-center shadow-sm">
                <div className="w-2.5 h-2.5 rounded-full bg-white" />
              </div>
              <span className="text-[14px] font-semibold text-[var(--text-1)]">New recording</span>
            </div>
            <button onClick={closeLauncher}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-3)]
                hover:bg-[var(--bg-soft)] hover:text-[var(--text-1)] transition-colors">
              <X size={15} />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Mode */}
            <div>
              <p className="text-[11px] font-semibold text-[var(--text-3)] uppercase tracking-wider mb-2.5">
                Recording mode
              </p>
              <div className="grid grid-cols-3 gap-2">
                {MODES.map(({ key, label, icon: Icon }) => (
                  <button key={key} onClick={() => setMode(key)}
                    className={clsx(
                      'relative flex flex-col items-center gap-2 py-3.5 px-2 rounded-xl border transition-all duration-150 text-center',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/50',
                      mode === key
                        ? 'bg-[var(--purple-soft)] border-[var(--purple-border)] text-[var(--purple)]'
                        : 'bg-[var(--bg-soft)] border-[var(--border)] text-[var(--text-2)] hover:border-[var(--purple-border)] hover:text-[var(--purple)]'
                    )}>
                    <Icon size={18} />
                    <span className="text-[12px] font-medium leading-tight">{label}</span>
                    {mode === key && (
                      <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[var(--purple)]" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-[var(--border)]" />

            {/* Options */}
            <div className="space-y-0.5">
              <p className="text-[11px] font-semibold text-[var(--text-3)] uppercase tracking-wider mb-2.5">Options</p>
              <OptionRow>
                <Toggle checked={micEnabled} onChange={toggleMic}
                  icon={micEnabled ? <Mic size={14} /> : <MicOff size={14} />}
                  label="Microphone" sublabel={micEnabled ? 'On' : 'Off'} />
              </OptionRow>
              {(mode === RECORDING_MODE.SCREEN || mode === RECORDING_MODE.SCREEN_CAMERA) && (
                <OptionRow>
                  <Toggle checked={systemAudioEnabled} onChange={toggleSystemAudio}
                    disabled={!systemAudioSupported}
                    icon={systemAudioEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                    label="System audio"
                    sublabel={!systemAudioSupported ? 'Not supported' : systemAudioEnabled ? 'On' : 'Off'} />
                </OptionRow>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-600 anim-fade-in">
                {error}
              </div>
            )}

            {/* CTA */}
            <Button variant="primary" size="lg" className="w-full" onClick={handleStart}
              loading={isRequesting} disabled={isRequesting}>
              {!isRequesting && <span className="w-2 h-2 rounded-full bg-white/80" />}
              {isRequesting ? 'Requesting access…' : 'Start recording'}
            </Button>

            <p className="text-center text-[11px] text-[var(--text-3)]">
              Press <kbd className="px-1.5 py-0.5 rounded-md bg-[var(--bg-soft)] border border-[var(--border)]
                text-[var(--text-2)] font-mono text-[10px]">Esc</kbd> to cancel
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function OptionRow({ children }) {
  return (
    <div className="flex items-center px-2 py-2.5 rounded-lg hover:bg-[var(--bg-soft)] transition-colors">
      {children}
    </div>
  );
}
