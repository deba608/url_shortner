import { useState, useCallback } from "react";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "@/context/ThemeContext";
import { ToastProvider } from "@/context/ToastContext";
import AppRoutes from "@/routes/AppRoutes";
import ErrorBoundary from "@/components/ErrorBoundary";
import AuthPanel from "@/components/AuthPanel";

// Provider order: Theme + Toast are app-wide and router-independent, so they wrap
// the router. Auth lives inside BrowserRouter because it uses navigation.
export default function App() {
  const [authPanel, setAuthPanel] = useState({ open: false, tab: "login" });

  const openAuth = useCallback((tab = "login") => {
    setAuthPanel({ open: true, tab });
  }, []);

  const closeAuth = useCallback(() => {
    setAuthPanel((s) => ({ ...s, open: false }));
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <BrowserRouter>
            <AppRoutes onOpenAuth={openAuth} />
            <AuthPanel
              open={authPanel.open}
              defaultTab={authPanel.tab}
              onClose={closeAuth}
            />
          </BrowserRouter>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
