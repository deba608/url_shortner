import { createContext, useState, useCallback, useMemo } from "react";

export const ToastContext = createContext(null);

let nextId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  // toast(message, type) where type ∈ success | error | info
  const toast = useCallback(
    (message, type = "success", duration = 3000) => {
      const id = nextId++;
      setToasts((list) => [...list, { id, message, type }]);
      setTimeout(() => dismiss(id), duration);
    },
    [dismiss]
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

const STYLES = {
  success: "border-green-500/30 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200",
  error: "border-red-500/30 bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200",
  info: "border-indigo-500/30 bg-indigo-50 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200",
};

// Fixed, stacked, top-right notifications. Lives inside the provider so any
// component can fire a toast via useToast() without prop-drilling.
function Toaster({ toasts, onDismiss }) {
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-full max-w-xs flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          onClick={() => onDismiss(t.id)}
          className={`pointer-events-auto cursor-pointer rounded-lg border px-4 py-3 text-sm shadow-md transition ${STYLES[t.type]}`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
