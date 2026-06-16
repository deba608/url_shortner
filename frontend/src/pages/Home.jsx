import { Link } from "react-router-dom";
import { ROUTES } from "@/utils/constants";

export default function Home() {
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
        <Link
          to={ROUTES.REGISTER}
          className="rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white transition hover:bg-indigo-700"
        >
          Get started
        </Link>
        <Link
          to={ROUTES.LOGIN}
          className="rounded-lg border border-gray-300 px-5 py-2.5 font-medium transition hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
        >
          Log in
        </Link>
      </div>
      <p className="mt-8 text-xs text-gray-400">
        Phase&nbsp;1 scaffold · routing + Tailwind + Axios wired ✓
      </p>
    </main>
  );
}
