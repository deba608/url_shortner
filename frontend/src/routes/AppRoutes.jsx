import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/utils/constants";
import ProtectedRoute from "@/routes/ProtectedRoute";
import DashboardLayout from "@/layouts/DashboardLayout";
import Spinner from "@/components/ui/Spinner";

const Home = lazy(() => import("@/pages/Home"));
const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const MyUrls = lazy(() => import("@/pages/MyUrls"));
const Analytics = lazy(() => import("@/pages/Analytics"));
const NotFound = lazy(() => import("@/pages/NotFound"));

function PublicOnly({ children }) {
  const { isAuthenticated, initializing } = useAuth();
  if (initializing) return null;
  return isAuthenticated ? <Navigate to={ROUTES.DASHBOARD} replace /> : children;
}

const PageLoader = () => (
  <div className="flex min-h-[50vh] items-center justify-center">
    <Spinner className="h-8 w-8 border-4 border-indigo-600 border-t-transparent dark:border-indigo-400" />
  </div>
);

export default function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.HOME} element={<Suspense fallback={<PageLoader />}><Home /></Suspense>} />
      <Route path={ROUTES.LOGIN} element={<Suspense fallback={<PageLoader />}><PublicOnly><Login /></PublicOnly></Suspense>} />
      <Route path={ROUTES.REGISTER} element={<Suspense fallback={<PageLoader />}><PublicOnly><Register /></PublicOnly></Suspense>} />
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path={ROUTES.DASHBOARD} element={<Suspense fallback={<PageLoader />}><Dashboard /></Suspense>} />
        <Route path={ROUTES.URLS} element={<Suspense fallback={<PageLoader />}><MyUrls /></Suspense>} />
        <Route path={ROUTES.ANALYTICS} element={<Suspense fallback={<PageLoader />}><Analytics /></Suspense>} />
      </Route>
      <Route path="*" element={<Suspense fallback={<PageLoader />}><NotFound /></Suspense>} />
    </Routes>
  );
}
