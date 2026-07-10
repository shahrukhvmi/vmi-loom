import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Download, Trash2, ArrowLeft, MoreVertical,
  Link2, Lock, MessageCircle, Send,
  Play, Pause, Volume2, VolumeX, Maximize,
  Monitor, Camera, Layers, Check, Upload, Loader2,
  ImageIcon, Clock, Edit3
} from 'lucide-react';
import { useRecorderStore } from '../context/recorderStore';
import { useUpload } from '../hooks/useUpload';
import { useScreenshot } from '../hooks/useScreenshot';
import { formatDuration, formatFileSize, downloadBlob, generateFilename, clamp } from '../utils';
import { RECORDING_MODE, RECORDING_STATE } from '../constants';

const MODE_LABEL = {
  [RECORDING_MODE.SCREEN]:        'Screen recording',
  [RECORDING_MODE.CAMERA]:        'Camera recording',
  [RECORDING_MODE.SCREEN_CAMERA]: 'Screen + Camera',
};

/* ── Inline video player ── */
function InlinePlayer({ src, onTimeUpdate }) {
  const videoRef  = useRef(null);
  const trackRef  = useRef(null);
  const hideTimer = useRef(null);
  const [playing,  setPlaying]  = useState(false);
  const [current,  setCurrent]  = useState(0);
  const [duration, setDuration] = useState(0);
  const [vol,      setVol]      = useState(1);
  const [muted,    setMuted]    = useState(false);
  const [ctrlVis,  setCtrlVis]  = useState(true);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !src) return;
    v.src = src; v.load();
    setPlaying(false); setCurrent(0); setDuration(0);
  }, [src]);

  const showCtrl = useCallback(() => {
    setCtrlVis(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setCtrlVis(false), 2800);
  }, []);

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); showCtrl(); }
    else { v.pause(); setPlaying(false); setCtrlVis(true); clearTimeout(hideTimer.current); }
  };

  const seek = (e) => {
    const v = videoRef.current, bar = trackRef.current;
    if (!v || !bar || !duration) return;
    const r = bar.getBoundingClientRect();
    v.currentTime = clamp((e.clientX - r.left) / r.width, 0, 1) * duration;
    showCtrl();
  };

  const pct = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <div className="relative bg-black rounded-2xl overflow-hidden" style={{ aspectRatio:'16/9' }}
      onMouseMove={showCtrl} onMouseLeave={() => playing && setCtrlVis(false)}>
      <video ref={videoRef} className="w-full h-full object-contain" onClick={toggle}
        onTimeUpdate={() => { const t = videoRef.current?.currentTime||0; setCurrent(t); onTimeUpdate?.(t); }}
        onDurationChange={() => setDuration(videoRef.current?.duration||0)}
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setCurrent(0); setCtrlVis(true); if(videoRef.current) videoRef.current.currentTime=0; }}
        playsInline />

      {/* Center play */}
      {!playing && (
        <button onClick={toggle} className="absolute inset-0 flex items-center justify-center group/play">
          <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm
            flex items-center justify-center transition-all group-hover/play:bg-white/18 group-hover/play:scale-105 active:scale-95">
            <Play size={22} className="text-white ml-1" fill="currentColor" />
          </div>
        </button>
      )}

      {/* Controls */}
      <div className={`absolute bottom-0 inset-x-0 transition-all duration-300 ${ctrlVis||!playing?'opacity-100':'opacity-0 pointer-events-none'}`}>
        <div className="bg-gradient-to-t from-black via-black/60 to-transparent pt-12 pb-4 px-4">
          <div ref={trackRef} onClick={seek}
            className="h-[3px] bg-white/20 rounded-full cursor-pointer mb-3.5 group/seek">
            <div className="h-full bg-white rounded-full relative" style={{ width:`${pct}%` }}>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white
                opacity-0 group-hover/seek:opacity-100 transition-opacity shadow" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggle} className="text-white/80 hover:text-white transition-colors">
              {playing ? <Pause size={17} /> : <Play size={17} fill="currentColor" />}
            </button>
            <span className="text-[12px] text-white/50 font-mono tabular-nums">
              {formatDuration(current)} / {formatDuration(duration)}
            </span>
            <button onClick={() => { const m=!muted; setMuted(m); if(videoRef.current) videoRef.current.muted=m; }}
              className="text-white/40 hover:text-white/80 transition-colors">
              {muted||vol===0 ? <VolumeX size={16}/> : <Volume2 size={16}/>}
            </button>
            <div className="flex-1" />
            <select className="bg-white/10 text-white/60 text-[12px] rounded-md px-2 py-1 border-0 outline-none cursor-pointer"
              onChange={e => { if(videoRef.current) videoRef.current.playbackRate=parseFloat(e.target.value); }}>
              <option value="1">1x</option><option value="1.25">1.25x</option>
              <option value="1.5">1.5x</option><option value="2">2x</option>
            </select>
            <button onClick={() => { if(document.fullscreenElement) document.exitFullscreen(); else videoRef.current?.requestFullscreen?.(); }}
              className="text-white/40 hover:text-white/80 transition-colors">
              <Maximize size={16}/>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Comments sidebar ── */
function CommentsSidebar({ currentTime }) {
  const [text, setText] = useState('');
  const [comments, setComments] = useState([]);
  const send = () => {
    if (!text.trim()) return;
    setComments(c => [...c, { id: Date.now(), name: 'You', time: Math.floor(currentTime), text: text.trim() }]);
    setText('');
  };
  return (
    <aside className="flex flex-col h-full min-h-0">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-[var(--border)] shrink-0">
        <MessageCircle size={16} className="text-[var(--text-3)]" />
        <span className="text-[15px] font-semibold text-[var(--text-1)]">Comments</span>
      </div>
      <div className="px-4 py-3 border-b border-[var(--border)] shrink-0">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-soft)] p-3
          focus-within:border-[var(--purple-border)] focus-within:bg-white transition-colors">
          <textarea value={text} onChange={e=>setText(e.target.value)} rows={3}
            onKeyDown={e => { if(e.key==='Enter'&&(e.metaKey||e.ctrlKey)) send(); }}
            placeholder={`Leave a comment at ${formatDuration(currentTime)}…`}
            className="w-full bg-transparent text-[13px] text-[var(--text-1)] placeholder:text-[var(--text-3)]
              resize-none outline-none leading-relaxed" />
          <div className="flex items-center justify-between mt-2">
            <span className="text-[12px] text-[var(--purple)] font-medium">
              Timestamp: {formatDuration(currentTime)}
            </span>
            <button onClick={send} disabled={!text.trim()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold
                bg-[var(--text-1)] hover:bg-[#1a1a2e] text-white disabled:opacity-40 disabled:pointer-events-none
                transition-all active:scale-95">
              <Send size={11} /> Send
            </button>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 divide-y divide-[var(--border)]">
        {comments.length === 0 && (
          <p className="text-[12px] text-[var(--text-3)] text-center py-8">No comments yet.</p>
        )}
        {comments.map(c => (
          <div key={c.id} className="py-4">
            <div className="flex justify-between items-baseline mb-1.5">
              <span className="text-[13px] font-semibold text-[var(--text-1)]">{c.name}</span>
              <span className="text-[12px] text-[var(--text-3)] font-mono tabular-nums">{formatDuration(c.time)}</span>
            </div>
            <p className="text-[13px] text-[var(--text-2)] leading-relaxed">{c.text}</p>
          </div>
        ))}
      </div>
    </aside>
  );
}

/* ── Screenshots panel in sidebar ── */
function ScreenshotsPanel() {
  const { screenshots, removeScreenshot, openScreenshotPreview } = useRecorderStore();
  const { downloadScreenshot } = useScreenshot();
  if (!screenshots.length) return null;
  return (
    <div className="border-t border-[var(--border)] px-4 py-4 shrink-0">
      <div className="flex items-center gap-2 mb-3">
        <ImageIcon size={13} className="text-[var(--text-3)]" />
        <span className="text-[11px] font-semibold text-[var(--text-3)] uppercase tracking-wider">
          Screenshots ({screenshots.length})
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {screenshots.map(shot => (
          <button key={shot.id} onClick={() => openScreenshotPreview(shot.id)}
            className="group relative rounded-xl overflow-hidden border border-[var(--border)]
              bg-[var(--bg-soft)] aspect-video hover:border-[var(--purple-border)] transition-colors">
            <img src={shot.url} alt="screenshot" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100
              transition-opacity flex items-center justify-center">
              <span className="text-[11px] text-white font-medium">View</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Main PreviewPage ── */
export function PreviewPage() {
  const { recordedBlob, recordedUrl, recordedMimeType,
    elapsedSeconds, recordingResolution, mode, reset } = useRecorderStore();
  const { recordingState, uploadProgress } = useRecorderStore();
  const { upload } = useUpload();

  const [title, setTitle] = useState(() => {
    const d = new Date();
    return `Recording – ${d.toLocaleDateString()} at ${d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}`;
  });
  const [editTitle, setEditTitle] = useState(false);
  const [playerTime, setPlayerTime] = useState(0);
  const [copied, setCopied] = useState(false);
  const [privacy, setPrivacy] = useState('Unlisted');

  if (!recordedUrl) return null;

  const ext = recordedMimeType?.includes('mp4') ? 'mp4' : 'webm';
  const modeLabel = MODE_LABEL[mode] || 'Recording';
  const isUploading = recordingState === RECORDING_STATE.UPLOADING;
  const isUploaded  = recordingState === RECORDING_STATE.UPLOADED;

  const copyLink = () => {
    navigator.clipboard?.writeText(window.location.href).catch(()=>{});
    setCopied(true); setTimeout(()=>setCopied(false),2000);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col anim-fade-in">

      {/* Nav */}
      <header className="h-14 shrink-0 flex items-center justify-between px-6 border-b border-[var(--border)] bg-white">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 mr-3">
            <div className="w-6 h-6 rounded-md bg-[var(--purple)] flex items-center justify-center shadow-sm">
              <div className="w-2 h-2 rounded-full bg-white" />
            </div>
            <span className="text-[14px] font-bold text-[var(--text-1)] tracking-tight">Recrd</span>
          </div>
          <button onClick={reset} className="flex items-center gap-1.5 text-[13px] text-[var(--text-3)]
            hover:text-[var(--text-1)] transition-colors">
            <ArrowLeft size={14} /> New recording
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1
            rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Ready
          </span>
          <button className="w-8 h-8 rounded-lg flex items-center justify-center
            text-[var(--text-3)] hover:bg-[var(--bg-soft)] transition-colors">
            <MoreVertical size={16}/>
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">

        {/* LEFT */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[820px] mx-auto px-6 py-7">

            {/* Title */}
            <div className="flex items-start justify-between gap-3 mb-1">
              <div className="flex-1 min-w-0">
                {editTitle ? (
                  <input autoFocus value={title} onChange={e=>setTitle(e.target.value)}
                    onBlur={()=>setEditTitle(false)}
                    onKeyDown={e=>e.key==='Enter'&&setEditTitle(false)}
                    className="w-full text-[22px] font-bold text-[var(--text-1)] bg-transparent
                      outline-none border-b-2 border-[var(--purple)] pb-0.5" />
                ) : (
                  <button onClick={()=>setEditTitle(true)}
                    className="group flex items-center gap-2 text-left">
                    <h1 className="text-[22px] font-bold text-[var(--text-1)] truncate">{title}</h1>
                    <Edit3 size={14} className="text-[var(--text-3)] opacity-0 group-hover:opacity-100
                      transition-opacity shrink-0 mt-1" />
                  </button>
                )}
                <p className="text-[13px] text-[var(--text-3)] mt-1.5">
                  <span className="text-[var(--purple)] font-medium">Recorded by you</span>
                  {' · '}{formatDuration(elapsedSeconds)}
                  {recordingResolution && ` · ${recordingResolution}`}
                  {' · '}{modeLabel}
                </p>
              </div>
              <button className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0
                text-[var(--text-3)] hover:bg-[var(--bg-soft)] transition-colors mt-0.5">
                <MoreVertical size={16}/>
              </button>
            </div>

            {/* Player */}
            <div className="mt-5">
              <InlinePlayer src={recordedUrl} onTimeUpdate={setPlayerTime} />
            </div>

            {/* Action buttons — exact Loom layout */}
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <button onClick={copyLink}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium
                  bg-[var(--text-1)] hover:bg-[#1a1a2e] text-white transition-all active:scale-95">
                {copied ? <><Check size={14}/> Copied!</> : <><Link2 size={14}/> Copy link</>}
              </button>
              <button onClick={() => downloadBlob(recordedBlob, generateFilename('recording', ext))}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium
                  border border-[var(--border)] hover:border-[var(--purple-border)] text-[var(--text-2)]
                  hover:text-[var(--purple)] bg-white transition-all active:scale-95 shadow-sm">
                <Download size={14}/> Download {ext.toUpperCase()}
              </button>
              <button onClick={()=>setPrivacy(p=>p==='Unlisted'?'Private':p==='Private'?'Public':'Unlisted')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium
                  border border-[var(--border)] hover:border-[var(--purple-border)] text-[var(--text-2)]
                  hover:text-[var(--purple)] bg-white transition-all active:scale-95 shadow-sm">
                <Lock size={14}/> {privacy}
              </button>
              <div className="flex-1"/>
              {isUploaded ? (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium
                  bg-emerald-50 border border-emerald-200 text-emerald-700">
                  <Check size={14}/> Uploaded
                </div>
              ) : isUploading ? (
                <div className="flex flex-col gap-1 min-w-[160px]">
                  <div className="flex items-center gap-2 text-[13px] text-[var(--text-2)]">
                    <Loader2 size={13} className="animate-spin text-[var(--purple)]"/>
                    Uploading… {uploadProgress}%
                  </div>
                  <div className="h-1 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
                    <div className="h-full bg-[var(--purple)] rounded-full transition-all duration-200"
                      style={{width:`${uploadProgress}%`}}/>
                  </div>
                </div>
              ) : (
                <button onClick={() => upload(title)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium
                    bg-[var(--purple)] hover:bg-[#6d28d9] text-white shadow-sm transition-all active:scale-95">
                  <Upload size={14}/> Upload video
                </button>
              )}
            </div>

            {/* Details card */}
            <div className="mt-6 surface-card p-5">
              <h3 className="text-[13px] font-semibold text-[var(--text-1)] mb-4">Recording details</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Detail label="Duration"   value={formatDuration(elapsedSeconds)} />
                <Detail label="File size"  value={formatFileSize(recordedBlob?.size)} />
                <Detail label="Format"     value={ext.toUpperCase()} />
                {recordingResolution && <Detail label="Resolution" value={recordingResolution} />}
              </div>
              <p className="text-[12px] text-[var(--text-3)] mt-4 pt-4 border-t border-[var(--border)] leading-relaxed">
                Upload uses a mock Cloudflare Stream API. Replace the{' '}
                <code className="font-mono bg-[var(--bg-subtle)] px-1.5 py-0.5 rounded text-[var(--text-2)]">TODO</code>{' '}
                blocks in <code className="font-mono bg-[var(--bg-subtle)] px-1.5 py-0.5 rounded text-[var(--text-2)]">cloudflareService.js</code>.
              </p>
            </div>

            <button onClick={reset}
              className="flex items-center gap-2 text-[13px] text-[var(--text-3)] hover:text-red-500
                transition-colors mt-5">
              <Trash2 size={13}/> Delete this recording
            </button>
          </div>
        </div>

        {/* RIGHT: Comments */}
        <div className="w-[320px] shrink-0 border-l border-[var(--border)] flex flex-col overflow-hidden bg-white">
          <CommentsSidebar currentTime={playerTime} />
          <ScreenshotsPanel />
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <div className="text-[11px] font-semibold text-[var(--text-3)] uppercase tracking-wider mb-1">{label}</div>
      <div className="text-[15px] font-bold text-[var(--text-1)]">{value}</div>
    </div>
  );
}
