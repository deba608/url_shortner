// Labelled input with inline error display. `error` renders the field invalid
// and shows the message beneath — wired to form validation in the auth pages.
export default function Input({ label, id, error, className = "", ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
      )}
      <input
        id={id}
        aria-invalid={!!error}
        className={`rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900 ${
          error
            ? "border-red-500 focus:ring-red-500"
            : "border-gray-300 dark:border-gray-700"
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
