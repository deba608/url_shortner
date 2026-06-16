// Labelled input with inline error display and optional icon slots.
export default function Input({
  label,
  id,
  error,
  icon: Icon,
  iconRight: IconRight,
  hint,
  className = "",
  inputClassName = "",
  ...props
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-gray-300">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
            <Icon className="h-4 w-4" />
          </div>
        )}
        <input
          id={id}
          aria-invalid={!!error}
          className={`w-full rounded-md border bg-[var(--bg-main)] px-3 py-2 text-sm text-[var(--text-main)] outline-none transition-all
            placeholder:text-[var(--text-muted)]
            focus:ring-2 focus:ring-[var(--color-primary)]/50 focus:border-[var(--color-primary)]
            disabled:cursor-not-allowed disabled:opacity-60
            ${Icon ? "pl-9" : ""}
            ${IconRight ? "pr-9" : ""}
            ${error
              ? "border-red-500 focus:ring-red-500/50 focus:border-red-500"
              : "border-[var(--border-color)]"
            }
            ${inputClassName}`}
          {...props}
        />
        {IconRight && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400">
            <IconRight className="h-4 w-4" />
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );
}
