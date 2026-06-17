import { Link } from "react-router-dom";
import { ROUTES, BRAND_NAME } from "@/utils/constants";
import Navbar from "@/components/Navbar";

/**
 * Shared layout for legal pages (Terms of Service, Privacy Policy).
 * Renders inside the public Navbar shell so it matches the rest of the
 * unauthenticated site. Pass a `title`, `lastUpdated` date, and `sections`
 * ({ heading, body }) via props.
 *
 * Each page supplies its own props rather than reading from a CMS, since the
 * content is static and small.
 */
export default function LegalPage({ title, lastUpdated, sections }) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-950 px-4 py-12 text-white">
        <article className="mx-auto max-w-3xl">
          <header className="mb-10">
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {title}
            </h1>
            {lastUpdated && (
              <p className="mt-2 text-sm text-gray-400">Last updated: {lastUpdated}</p>
            )}
          </header>

          <div className="flex flex-col gap-8">
            {sections.map((section, i) => (
              <section key={i}>
                <h2 className="mb-2 text-lg font-semibold text-indigo-300">
                  {section.heading}
                </h2>
                {Array.isArray(section.body) ? (
                  <div className="flex flex-col gap-2 text-sm leading-relaxed text-gray-300">
                    {section.body.map((para, j) => (
                      <p key={j}>{para}</p>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed text-gray-300">{section.body}</p>
                )}
              </section>
            ))}
          </div>

          <footer className="mt-12 border-t border-white/10 pt-6">
            <Link
              to={ROUTES.HOME}
              className="text-sm font-semibold text-indigo-400 hover:underline"
            >
              ← Back to {BRAND_NAME}
            </Link>
          </footer>
        </article>
      </main>
    </>
  );
}
