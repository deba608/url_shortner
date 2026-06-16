import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/utils/constants";
import ProtectedRoute from "@/routes/ProtectedRoute";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import NotFound from "@/pages/NotFound";

// Redirects authenticated users away from auth pages (no point showing Login to
// someone already logged in).
function PublicOnly({ children }) {
  const { isAuthenticated, initializing } = useAuth();
  if (initializing) return null;
  return isAuthenticated ? <Navigate to={ROUTES.DASHBOARD} replace /> : children;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.HOME} element={<Home />} />
      <Route path={ROUTES.LOGIN} element={<PublicOnly><Login /></PublicOnly>} />
      <Route path={ROUTES.REGISTER} element={<PublicOnly><Register /></PublicOnly>} />
      <Route
        path={ROUTES.DASHBOARD}
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
