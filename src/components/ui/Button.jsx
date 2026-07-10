import { clsx } from "clsx";

const variants = {
  primary:
    "bg-[#7c3aed] hover:bg-[#6d28d9] active:bg-[#5b21b6] text-white border border-purple-700/20 shadow-sm",
  secondary:
    "bg-white hover:bg-[#f8f8fa] text-[#1a1a2e] border border-[#ebebf0] hover:border-[#d4c5fd]",
  ghost: "text-[#555570] hover:bg-[#f8f8fa] hover:text-[#1a1a2e]",
  danger:
    "bg-[#fef2f2] hover:bg-[#fee2e2] text-[#dc2626] border border-[#fecaca]",
  outline:
    "border border-[#ebebf0] hover:border-[#d4c5fd] text-[#555570] hover:text-[#7c3aed] bg-transparent",
  purple_soft:
    "bg-[#f0ecfe] hover:bg-[#e4dbfd] text-[#7c3aed] border border-[#d4c5fd]",
};

const sizes = {
  xs: "px-2.5 py-1 text-[11px] gap-1.5 rounded-[8px]",
  sm: "px-3.5 py-2 text-[13px] gap-2 rounded-[10px]",
  md: "px-4 py-2.5 text-[13px] gap-2 rounded-[12px]",
  lg: "px-5 py-3 text-[14px] gap-2.5 rounded-[14px]",
  icon: "p-2.5 rounded-[12px]",
  "icon-sm": "p-1.5 rounded-[8px]",
};

export function Button({
  children,
  variant = "secondary",
  size = "md",
  className,
  disabled,
  loading,
  onClick,
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={clsx(
        "inline-flex items-center justify-center font-medium transition-all duration-150 select-none cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/40 focus-visible:ring-offset-1",
        "disabled:opacity-40 disabled:pointer-events-none active:scale-[.97]",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      ) : (
        children
      )}
    </button>
  );
}
