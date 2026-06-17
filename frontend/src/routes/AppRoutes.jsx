import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/utils/constants";
import ProtectedRoute from "@/routes/ProtectedRoute";
import DashboardLayout from "@/layouts/DashboardLayout";
import Navbar from "@/components/Navbar";
import Spinner from "@/components/ui/Spinner";

const Home = lazy(() => import("@/pages/Home"));
const Login = lazy(() => import("@/pages/Login"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const MyUrls = lazy(() => import("@/pages/MyUrls"));
const Analytics = lazy(() => import("@/pages/Analytics"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const Redirect = lazy(() => import("@/pages/Redirect"));
const Terms = lazy(() => import("@/pages/Terms"));
const Privacy = lazy(() => import("@/pages/Privacy"));
const Register = lazy(() => import("@/pages/Register"));

// Redirect signed-in users away from auth pages (login, register, etc.)
function PublicOnly({ children }) {
  const { isAuthenticated, initializing } = useAuth();
  if (initializing) return null;
  return isAuthenticated ? <Navigate to={ROUTES.DASHBOARD} replace /> : children;
}

function WithNavbar({ children }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}

const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
        <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      </div>
      <Spinner className="h-5 w-5 text-indigo-500" />
    </div>
  </div>
);

export default function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public landing */}
        <Route path={ROUTES.HOME} element={<WithNavbar><Home /></WithNavbar>} />

        {/* Auth page — redirect signed-in users to dashboard */}
        <Route path={ROUTES.LOGIN} element={<PublicOnly><Login /></PublicOnly>} />
        <Route path={ROUTES.REGISTER} element={<PublicOnly><Register /></PublicOnly>} />

        {/* Authenticated app */}
        <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
          <Route path={ROUTES.URLS} element={<MyUrls />} />
          <Route path={ROUTES.ANALYTICS} element={<Analytics />} />
        </Route>

        <Route path="/:shortCode" element={<Redirect />} />

        {/* Legal pages */}
        <Route path={ROUTES.TERMS} element={<WithNavbar><Terms /></WithNavbar>} />
        <Route path={ROUTES.PRIVACY} element={<WithNavbar><Privacy /></WithNavbar>} />

        <Route path="*" element={<WithNavbar><NotFound /></WithNavbar>} />
      </Routes>
    </Suspense>
  );
}
