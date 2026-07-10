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
      'fixed bottom-[100px] right-6 z-[9998] transition-all duration-300',
      visible && hasFrame ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'
    )}>
      <div className="relative rounded-[20px] overflow-hidden"
        style={{
          boxShadow: '0 8px 32px rgba(0,0,0,.25), 0 0 0 2px rgba(139,92,246,.35)',
        }}>
        <video ref={videoRef} muted playsInline
          onCanPlay={() => setHasFrame(true)}
          className="w-[180px] h-[135px] object-cover block"
          style={{ background: 'var(--bg-subtle)', transform: 'scaleX(-1)' }} />

        {/* LIVE indicator */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5
          bg-white/85 backdrop-blur-sm rounded-full px-2.5 py-1 shadow-sm">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute h-full w-full rounded-full bg-red-400 opacity-60" />
            <span className="relative h-1.5 w-1.5 rounded-full bg-red-500 block rec-dot" />
          </span>
          <span className="text-[10px] font-bold text-red-600 tracking-[0.06em]">LIVE</span>
        </div>
      </div>
    </div>
  );
}
