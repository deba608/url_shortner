import { useState, useCallback } from "react";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "@/context/ThemeContext";
import { ToastProvider } from "@/context/ToastContext";
import { AuthProvider } from "@/context/AuthContext";
import AppRoutes from "@/routes/AppRoutes";
import AuthPanel from "@/components/AuthPanel";
import ErrorBoundary from "@/components/ErrorBoundary";

// Provider order: Theme + Toast are app-wide and router-independent, so they wrap
// the router. Auth lives inside BrowserRouter because it uses navigation.
//
// AuthPanel is lifted to App so it can be opened from anywhere in the tree:
//   - Navbar "Log in / Sign up" buttons
//   - Landing page CTA buttons
//   - Protected-route redirects (future)
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
            <AuthProvider>
              <AppRoutes onOpenAuth={openAuth} />
              <AuthPanel
                open={authPanel.open}
                defaultTab={authPanel.tab}
                onClose={closeAuth}
              />
            </AuthProvider>
          </BrowserRouter>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
