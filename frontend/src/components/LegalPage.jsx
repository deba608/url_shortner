import { Link } from "react-router-dom";
import { ROUTES, BRAND_NAME } from "@/utils/constants";

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
    <main className="min-h-screen px-4 py-12">
      <article className="mx-auto max-w-3xl">
        <header className="mb-10 animate-slide-up delay-100">
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-main)] sm:text-4xl">
            {title}
          </h1>
          {lastUpdated && (
            <p className="mt-2 text-sm text-[var(--text-muted)]">Last updated: {lastUpdated}</p>
          )}
        </header>

        <div className="rounded-xl border border-white/10 bg-[var(--bg-surface)]/80 backdrop-blur p-6 sm:p-8 shadow-lg shadow-black/30 flex flex-col gap-8 animate-slide-up delay-200">
          {sections.map((section, i) => (
            <section key={i}>
              <h2 className="mb-2 text-lg font-semibold text-[var(--color-primary)]">
                {section.heading}
              </h2>
              {Array.isArray(section.body) ? (
                <div className="flex flex-col gap-2 text-sm leading-relaxed text-[var(--text-muted)]">
                  {section.body.map((para, j) => (
                    <p key={j}>{para}</p>
                  ))}
                </div>
              ) : (
                <p className="text-sm leading-relaxed text-[var(--text-muted)]">{section.body}</p>
              )}
            </section>
          ))}
        </div>

        <footer className="mt-8 animate-slide-up delay-300">
          <Link
            to={ROUTES.HOME}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-primary)] hover:underline transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to {BRAND_NAME}
          </Link>
        </footer>
      </article>
    </main>
  );
}
