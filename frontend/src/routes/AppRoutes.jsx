import { Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import NotFound from "@/pages/NotFound";

// Central route table. Auth pages, protected routes, and lazy-loading are layered
// in here in later phases (Phase 2: auth + ProtectedRoute, Phase 7: lazy imports).
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
