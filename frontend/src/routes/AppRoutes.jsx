import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/utils/constants";
import ProtectedRoute from "@/routes/ProtectedRoute";
import DashboardLayout from "@/layouts/DashboardLayout";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import MyUrls from "@/pages/MyUrls";
import Analytics from "@/pages/Analytics";
import NotFound from "@/pages/NotFound";

// Redirects authenticated users away from auth pages.
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

      {/* Authenticated app: ProtectedRoute guards the shared layout, nested
          routes render inside its <Outlet/>. */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
        <Route path={ROUTES.URLS} element={<MyUrls />} />
        <Route path={ROUTES.ANALYTICS} element={<Analytics />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
