import { Link } from "react-router-dom";

// Shared shell for the Login/Register screens — centred card with a title and a
// footer link. Keeps the two auth pages visually consistent and DRY.
export default function AuthCard({ title, subtitle, children, footer }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <Link to="/" className="mb-6 block text-center text-lg font-bold">
          Shortly
        </Link>
        <h1 className="text-xl font-semibold">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
        <div className="mt-6">{children}</div>
        {footer && <div className="mt-6 text-center text-sm text-gray-500">{footer}</div>}
      </div>
    </main>
  );
}
