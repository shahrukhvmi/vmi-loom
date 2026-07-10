import { useState } from 'react';
import { Pause, Play, Square, X, Camera, Maximize, Crop } from 'lucide-react';
import { useRecorderStore } from '../../context/recorderStore';
import { useRecorder } from '../../hooks/useRecorder';
import { useScreenshot } from '../../hooks/useScreenshot';
import { RecordingTimer } from './RecordingTimer';
import { RECORDING_STATE } from '../../constants';
import { clsx } from 'clsx';

export function RecordingControls() {
  const { recordingState, elapsedSeconds, isPaused } = useRecorderStore();
  const { pauseRecording, resumeRecording, stopRecording, cancelRecording } = useRecorder();
  const { captureFromActiveStream, captureArea } = useScreenshot();
  const [showShotMenu, setShowShotMenu] = useState(false);
  const [shotLoading,  setShotLoading]  = useState(false);

  const isActive =
    recordingState === RECORDING_STATE.RECORDING ||
    recordingState === RECORDING_STATE.PAUSED;

  if (!isActive) return null;

  const takeShot = async (mode) => {
    setShowShotMenu(false);
    setShotLoading(true);
    try {
      if (mode === 'area')   await captureArea();
      else                   await captureFromActiveStream();
    } catch {}
    setShotLoading(false);
  };

  return (
    <div className="fixed bottom-6 left-1/2 z-[9999] anim-slide-bar" style={{ transform: 'translateX(-50%)' }}>
      <div className="bg-white border border-[var(--border)] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,.14)]
        px-2 py-2 flex items-center gap-1">

        {/* Timer */}
        <RecordingTimer seconds={elapsedSeconds} isPaused={isPaused} />

        <Sep />

        {/* Pause/Resume */}
        <Btn onClick={isPaused ? resumeRecording : pauseRecording}
          title={isPaused ? 'Resume' : 'Pause'}>
          {isPaused ? <Play size={15} fill="currentColor" className="text-purple-600" />
                    : <Pause size={15} className="text-[var(--text-2)]" />}
        </Btn>

        {/* Screenshot picker */}
        <div className="relative">
          <Btn onClick={() => setShowShotMenu(!showShotMenu)} title="Screenshot"
            className={shotLoading ? 'opacity-50 pointer-events-none' : ''}>
            {shotLoading
              ? <svg className="animate-spin h-4 w-4 text-purple-600" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              : <Camera size={15} className="text-[var(--text-2)]" />}
          </Btn>

          {showShotMenu && (
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-44
              bg-white border border-[var(--border)] rounded-xl shadow-lg overflow-hidden anim-scale-in">
              <button onClick={() => takeShot('stream')}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-[var(--text-1)]
                  hover:bg-[var(--bg-soft)] transition-colors text-left">
                <Maximize size={14} className="text-[var(--text-3)]" />
                Full screen
              </button>
              <button onClick={() => takeShot('area')}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-[var(--text-1)]
                  hover:bg-[var(--bg-soft)] transition-colors text-left border-t border-[var(--border)]">
                <Crop size={14} className="text-[var(--text-3)]" />
                Selected area
              </button>
            </div>
          )}
        </div>

        <Sep />

        {/* Stop */}
        <button onClick={stopRecording} title="Stop recording"
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-medium
            bg-red-50 hover:bg-red-100 text-red-600 border border-red-200
            transition-all duration-150 active:scale-95">
          <Square size={12} fill="currentColor" />
          Stop
        </button>

        <Sep />

        {/* Cancel */}
        <Btn onClick={cancelRecording} title="Discard" className="text-[var(--text-3)] hover:text-red-500">
          <X size={14} />
        </Btn>
      </div>
    </div>
  );
}

function Btn({ children, onClick, title, className }) {
  return (
    <button onClick={onClick} title={title}
      className={clsx('w-8 h-8 flex items-center justify-center rounded-xl',
        'hover:bg-[var(--bg-soft)] transition-all duration-100 active:scale-90', className)}>
      {children}
    </button>
  );
}
function Sep() {
  return <div className="w-px h-5 bg-[var(--border-mid)] mx-0.5" />;
}
