import { useEffect, useRef, useState } from 'react';
import { useRecorderStore } from '../../context/recorderStore';
import { RECORDING_STATE, RECORDING_MODE } from '../../constants';
import { clsx } from 'clsx';

export function CameraPreview() {
  const { cameraStream, mode, recordingState } = useRecorderStore();
  const videoRef = useRef(null);
  const [hasFrame, setHasFrame] = useState(false);

  const isActiveMode  = mode === RECORDING_MODE.CAMERA || mode === RECORDING_MODE.SCREEN_CAMERA;
  const isActiveState = recordingState === RECORDING_STATE.REQUESTING
    || recordingState === RECORDING_STATE.RECORDING
    || recordingState === RECORDING_STATE.PAUSED;
  const visible = isActiveMode && isActiveState && !!cameraStream;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (cameraStream) {
      video.srcObject = cameraStream;
      setHasFrame(false);
      video.play().catch(() => {});
    } else {
      video.srcObject = null;
      setHasFrame(false);
    }
  }, [cameraStream]);

  return (
    <div className={clsx(
      'fixed bottom-24 right-5 z-[9998] transition-all duration-300',
      visible && hasFrame ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
    )}>
      <div className="relative rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,.25)]
        ring-2 ring-purple-400/40">
        <video ref={videoRef} muted playsInline
          onCanPlay={() => setHasFrame(true)}
          className="w-[176px] h-[132px] object-cover block bg-[var(--bg-subtle)]"
          style={{ transform: 'scaleX(-1)' }} />
        <div className="absolute top-2 left-2 flex items-center gap-1.5
          bg-white/80 backdrop-blur-sm rounded-full px-2 py-0.5 shadow-sm">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute h-full w-full rounded-full bg-red-400 opacity-60" />
            <span className="relative h-1.5 w-1.5 rounded-full bg-red-500 block rec-dot" />
          </span>
          <span className="text-[10px] font-semibold text-red-600 tracking-wider">LIVE</span>
        </div>
        <div className="absolute inset-0 rounded-2xl ring-1 ring-black/5 pointer-events-none" />
      </div>
    </div>
  );
}
