import Spinner from "@/components/ui/Spinner";

const VARIANTS = {
  primary:
    "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] border border-transparent shadow-sm",
  secondary:
    "bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-main)] hover:bg-white/5",
  danger:
    "bg-red-600 text-white hover:bg-red-500 shadow-sm",
  ghost:
    "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-white/5",
};

const SIZES = {
  sm: "px-3 py-1.5 text-xs rounded-md",
  md: "px-4 py-2 text-sm rounded-md",
  lg: "px-5 py-2.5 text-sm rounded-md",
};

export default function Button({
  children,
  variant = "primary",
  loading = false,
  disabled = false,
  size = "md",
  className = "",
  ...props
}) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 font-medium transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${SIZES[size]} ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  );
}
