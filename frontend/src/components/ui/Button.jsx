import Spinner from "@/components/ui/Spinner";

const VARIANTS = {
  primary:
    "bg-indigo-500/30 backdrop-blur-md text-white hover:bg-indigo-500/40 border border-indigo-400/30 shadow-sm",
  secondary:
    "bg-white/5 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 shadow-sm",
  danger:
    "bg-red-500/30 backdrop-blur-md text-white hover:bg-red-500/40 border border-red-400/30 shadow-sm",
  ghost:
    "text-gray-400 hover:text-white hover:bg-white/10",
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
