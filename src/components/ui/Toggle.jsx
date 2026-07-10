import { clsx } from 'clsx';

export function Toggle({ checked, onChange, disabled, label, icon, sublabel }) {
  return (
    <label className={clsx('flex items-center gap-3 cursor-pointer select-none group w-full', disabled && 'opacity-40 pointer-events-none')}>
      {icon && (
        <span className={clsx('w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors',
          checked ? 'bg-purple-100 text-purple-600' : 'bg-[#f0f0f5] text-[#8888aa]',
          'group-hover:text-purple-600')}>
          {icon}
        </span>
      )}
      <div className="flex-1 min-w-0">
        {label    && <div className="text-[13px] font-medium text-[#0f0f14]">{label}</div>}
        {sublabel && <div className="text-[11px] text-[#8888aa] mt-0.5">{sublabel}</div>}
      </div>
      <button type="button" role="switch" aria-checked={checked} onClick={() => onChange?.(!checked)}
        className={clsx('relative shrink-0 w-8 h-[18px] rounded-full transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/50',
          checked ? 'bg-[#7c3aed]' : 'bg-[#d4d4e0]')}>
        <span className={clsx('absolute top-[2px] left-[2px] h-[14px] w-[14px] rounded-full bg-white shadow-sm transition-transform duration-200',
          checked ? 'translate-x-[14px]' : 'translate-x-0')} />
      </button>
    </label>
  );
}
