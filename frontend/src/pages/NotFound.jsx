import { Link } from "react-router-dom";
import { ROUTES } from "@/utils/constants";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 hero-bg">
      <div className="text-center animate-slide-up">
        <div className="mx-auto mb-6 h-20 w-20 rounded-3xl btn-gradient flex items-center justify-center animate-pulse-glow">
          <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-7xl font-black gradient-text mb-4">404</p>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Page not found</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-xs mx-auto">
          The link you followed may be broken or this short URL may have expired.
        </p>
        <Link
          to={ROUTES.HOME}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl btn-gradient text-white font-semibold hover:opacity-90 transition-opacity"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Shortly
        </Link>
      </div>
    </div>
  );
}
