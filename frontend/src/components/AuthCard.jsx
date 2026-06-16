import Logo from "@/components/Logo";

export default function AuthCard({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-900">
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
          <div className="mt-10 grid grid-cols-3 gap-6">
            {[["10K+", "Links"], ["99.9%", "Uptime"], ["< 100ms", "Speed"]].map(([v, l]) => (
              <div key={l} className="text-center">
                <p className="text-2xl font-black text-white">{v}</p>
                <p className="text-sm text-gray-400">{l}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 lg:border-none">
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
