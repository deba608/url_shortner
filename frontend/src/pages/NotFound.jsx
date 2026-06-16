import { Link } from "react-router-dom";
import { ROUTES } from "@/utils/constants";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function NotFound() {
  useDocumentTitle("Page not found");
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-6xl font-bold text-indigo-600 dark:text-indigo-400">404</p>
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <Link to={ROUTES.HOME} className="text-indigo-600 hover:underline dark:text-indigo-400">
        ← Back home
      </Link>
    </main>
  );
}
