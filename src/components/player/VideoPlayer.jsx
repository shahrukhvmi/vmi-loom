import { useRef, useState, useCallback, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw } from 'lucide-react';
import { formatDuration, clamp } from '../../utils';
import { clsx } from 'clsx';

export function VideoPlayer({ src, mimeType, className }) {
  const videoRef = useRef(null);
  const progressRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const hideRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    video.src = src;
    video.load();
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [src]);

  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    clearTimeout(hideRef.current);
    hideRef.current = setTimeout(() => {
      if (playing) setShowControls(false);
    }, 2500);
  }, [playing]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setPlaying(true);
    } else {
      video.pause();
      setPlaying(false);
      setShowControls(true);
    }
  }, []);

  const handleSeek = useCallback((e) => {
    const video = videoRef.current;
    const bar = progressRef.current;
    if (!video || !bar) return;
    const rect = bar.getBoundingClientRect();
    const ratio = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    video.currentTime = ratio * duration;
  }, [duration]);

  const handleEnded = () => {
    setPlaying(false);
    setCurrentTime(0);
    setShowControls(true);
    if (videoRef.current) videoRef.current.currentTime = 0;
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !muted;
    setMuted(!muted);
  };

  const handleVolumeChange = (e) => {
    const v = parseFloat(e.target.value);
    if (videoRef.current) videoRef.current.volume = v;
    setVolume(v);
    setMuted(v === 0);
  };

  const handleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      video.requestFullscreen?.();
    }
  };

  const replay = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    videoRef.current.play();
    setPlaying(true);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className={clsx('relative group bg-black rounded-2xl overflow-hidden', className)}
      onMouseMove={resetHideTimer}
      onMouseLeave={() => playing && setShowControls(false)}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        onClick={togglePlay}
        onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
        onDurationChange={() => setDuration(videoRef.current?.duration || 0)}
        onEnded={handleEnded}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        playsInline
      />

      {/* Center play button overlay when paused */}
      {!playing && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/20 group/play"
        >
          <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm flex items-center justify-center transition-all duration-200 group-hover/play:bg-white/20 group-hover/play:scale-105">
            <Play size={24} className="text-white ml-1" fill="currentColor" />
          </div>
        </button>
      )}

      {/* Controls bar */}
      <div className={clsx(
        'absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent px-4 pt-10 pb-3 transition-opacity duration-300',
        showControls || !playing ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}>
        {/* Progress bar */}
        <div
          ref={progressRef}
          className="h-1 bg-white/20 rounded-full cursor-pointer mb-3 group/bar"
          onClick={handleSeek}
        >
          <div
            className="h-full bg-purple-500 rounded-full relative transition-all duration-100"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover/bar:opacity-100 transition-opacity" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Play/Pause */}
          <button onClick={togglePlay} className="text-white hover:text-purple-300 transition-colors">
            {playing ? <Pause size={17} /> : <Play size={17} fill="currentColor" />}
          </button>

          {/* Replay */}
          <button onClick={replay} className="text-zinc-400 hover:text-white transition-colors">
            <RotateCcw size={15} />
          </button>

          {/* Time */}
          <span className="text-xs text-zinc-300 font-mono tabular-nums">
            {formatDuration(currentTime)} / {formatDuration(duration)}
          </span>

          <div className="flex-1" />

          {/* Volume */}
          <div className="flex items-center gap-2">
            <button onClick={toggleMute} className="text-zinc-400 hover:text-white transition-colors">
              {muted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <input
              type="range"
              min="0" max="1" step="0.05"
              value={muted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 accent-purple-500"
            />
          </div>

          {/* Fullscreen */}
          <button onClick={handleFullscreen} className="text-zinc-400 hover:text-white transition-colors">
            <Maximize size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
