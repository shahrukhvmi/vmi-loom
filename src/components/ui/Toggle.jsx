import { clsx } from 'clsx';

export function Toggle({ checked, onChange, disabled, label, icon, sublabel }) {
  return (
    <label className={clsx(
      'flex items-center gap-3.5 cursor-pointer select-none group w-full',
      disabled && 'opacity-40 pointer-events-none'
    )}>
      {icon && (
        <span className={clsx(
          'w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 transition-all duration-150',
          checked
            ? 'bg-[var(--purple-soft)] text-[var(--purple)]'
            : 'bg-[var(--bg-subtle)] text-[var(--text-3)]',
          'group-hover:text-[var(--purple)]'
        )}>
          {icon}
        </span>
      )}
      <div className="flex-1 min-w-0">
        {label    && <div className="text-[13px] font-medium" style={{ color: 'var(--text-1)' }}>{label}</div>}
        {sublabel && <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-3)' }}>{sublabel}</div>}
      </div>
      <button type="button" role="switch" aria-checked={checked}
        onClick={() => onChange?.(!checked)}
        className={clsx(
          'relative shrink-0 w-9 h-5 rounded-full transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/40',
          checked ? 'bg-[var(--purple)]' : 'bg-[var(--border-mid)]'
        )}>
        <span className={clsx(
          'absolute top-[2px] left-[2px] h-4 w-4 rounded-full bg-white transition-transform duration-200',
          'shadow-sm',
          checked ? 'translate-x-4' : 'translate-x-0'
        )} />
      </button>
    </label>
  );
}
