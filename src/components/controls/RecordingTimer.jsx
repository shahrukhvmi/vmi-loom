import { formatDuration } from '../../utils';
import { clsx } from 'clsx';

export function RecordingTimer({ seconds, isPaused }) {
  return (
    <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-[10px]"
      style={{ background: 'var(--bg-soft)' }}>
      <span className="relative flex h-2 w-2 shrink-0">
        {!isPaused && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-60" />
        )}
        <span className={clsx(
          'relative h-2 w-2 rounded-full block',
          isPaused ? 'bg-yellow-400' : 'bg-red-500 rec-dot'
        )} />
      </span>
      <span className="font-mono text-[13px] font-semibold tabular-nums"
        style={{ color: 'var(--text-1)' }}>
        {formatDuration(seconds)}
      </span>
      {isPaused && (
        <span className="text-[10px] font-bold text-yellow-600 uppercase tracking-[0.08em]">
          Paused
        </span>
      )}
    </div>
  );
}
