import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/utils/constants";
import Button from "@/components/ui/Button";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function Home() {
  useDocumentTitle("");
  const navigate = useNavigate();

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
        Shorten. Share. <span className="text-indigo-600 dark:text-indigo-400">Track.</span>
      </h1>
      <p className="text-lg text-gray-600 dark:text-gray-400">
        A fast, analytics-rich URL shortener. Create short links, generate QR codes,
        and watch the clicks roll in.
      </p>
      <div className="flex gap-3">
        <Button onClick={() => navigate(ROUTES.REGISTER)}>
          Get started
        </Button>
        <Button variant="secondary" onClick={() => navigate(ROUTES.LOGIN)}>
          Log in
        </Button>
      </div>
    </main>
  );
}
