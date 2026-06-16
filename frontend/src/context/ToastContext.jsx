import { createContext, useState, useCallback, useMemo, useRef } from "react";

export const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message, type = "success", duration = 3500) => {
      const id = nextId.current++;
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

const CONFIGS = {
  success: {
    bar: "bg-emerald-500",
    icon: (
      <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
    cls: "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700",
    text: "text-gray-900 dark:text-gray-100",
  },
  error: {
    bar: "bg-red-500",
    icon: (
      <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    cls: "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700",
    text: "text-gray-900 dark:text-gray-100",
  },
  info: {
    bar: "bg-indigo-500",
    icon: (
      <svg className="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    cls: "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700",
    text: "text-gray-900 dark:text-gray-100",
  },
};

function Toaster({ toasts, onDismiss }) {
  return (
    <div className="pointer-events-none fixed right-4 bottom-6 z-[100] flex flex-col gap-2 w-full max-w-sm">
      {toasts.map((t) => {
        const cfg = CONFIGS[t.type] || CONFIGS.info;
        return (
          <div
            key={t.id}
            role="status"
            onClick={() => onDismiss(t.id)}
            className={`pointer-events-auto cursor-pointer rounded-xl shadow-lg overflow-hidden animate-slide-up ${cfg.cls}`}
          >
            {/* Color bar */}
            <div className={`h-0.5 ${cfg.bar}`} />
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="flex-shrink-0">{cfg.icon}</div>
              <p className={`text-sm font-medium flex-1 ${cfg.text}`}>{t.message}</p>
              <button
                onClick={(e) => { e.stopPropagation(); onDismiss(t.id); }}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
