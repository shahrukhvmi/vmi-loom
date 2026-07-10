import { clsx } from 'clsx';

const variants = {
  primary:   'bg-[#7c3aed] hover:bg-[#6d28d9] text-white shadow-sm shadow-purple-200 border border-purple-700/20 active:bg-[#5b21b6]',
  secondary: 'bg-white hover:bg-[#f7f7f9] text-[#0f0f14] border border-[#e4e4ec] hover:border-[#c4b5fd] shadow-sm active:bg-[#f0f0f5]',
  ghost:     'text-[#4a4a6a] hover:bg-[#f0f0f5] hover:text-[#0f0f14]',
  danger:    'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200',
  outline:   'border border-[#e4e4ec] hover:border-[#c4b5fd] text-[#4a4a6a] hover:text-[#7c3aed] bg-transparent',
  purple_soft:'bg-[#ede9fe] hover:bg-[#ddd6fe] text-[#7c3aed] border border-[#c4b5fd]',
};
const sizes = {
  xs:      'px-2.5 py-1 text-[11px] gap-1 rounded-lg',
  sm:      'px-3 py-1.5 text-[13px] gap-1.5 rounded-[10px]',
  md:      'px-3.5 py-2 text-[13px] gap-2 rounded-xl',
  lg:      'px-5 py-2.5 text-[14px] gap-2 rounded-xl',
  icon:    'p-2 rounded-xl',
  'icon-sm':'p-1.5 rounded-lg',
};

export function Button({ children, variant='secondary', size='md', className, disabled, loading, onClick, type='button', ...props }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled||loading}
      className={clsx(
        'inline-flex items-center justify-center font-medium transition-all duration-150 select-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/50 focus-visible:ring-offset-1',
        'disabled:opacity-40 disabled:pointer-events-none active:scale-[.97]',
        variants[variant], sizes[size], className
      )} {...props}>
      {loading
        ? <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        : children}
    </button>
  );
}
