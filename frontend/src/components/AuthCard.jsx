import Logo from "@/components/Logo";

export default function AuthCard({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="relative z-10 flex flex-col justify-center px-12">
          <div className="mb-12">
            <Logo size="lg" />
          </div>
          <h2 className="text-4xl font-black leading-tight mb-4 text-white">
            Shorten. Share.<br />Track everything.
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed max-w-xs">
            Create branded short links, QR codes, and detailed analytics — all in one place.
          </p>
          <ul className="mt-10 flex flex-col gap-4 max-w-sm">
            {[
              ["Custom aliases", "Choose your own memorable short codes."],
              ["QR codes", "Generate a downloadable QR for every link."],
              ["Click analytics", "Track total, unique, daily, and weekly clicks."],
              ["Link expiration", "Set links to expire by date or after N days."],
            ].map(([title, desc]) => (
              <li key={title} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-white">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="text-sm text-gray-400">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 lg:hidden">
          <div className="lg:hidden">
            <Logo size="sm" />
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm animate-slide-up">
            <h1 className="text-2xl font-black text-white">{title}</h1>
            {subtitle && (
              <p className="mt-1 text-sm text-gray-400">{subtitle}</p>
            )}
            <div className="mt-6">{children}</div>
            {footer && (
              <div className="mt-6 text-center text-sm text-gray-400">{footer}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
