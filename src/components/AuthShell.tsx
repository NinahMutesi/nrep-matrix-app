export function AuthShell({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div
        className="hidden w-1/2 flex-col justify-between p-12 text-white lg:flex"
        style={{ backgroundColor: '#054653' }}
      >
        {/* NREP Logo */}
        <div className="flex items-center gap-4">
          <img
            src="/nrep-logo.png"
            alt="NREP Logo"
            className="h-16 w-16 object-contain"
          />
          <div>
            <p
              className="font-mono text-[11px] uppercase tracking-[0.25em] font-bold"
              style={{ color: '#D98E2B' }}
            >
              NREP
            </p>
            <p className="text-base font-semibold text-white leading-snug">
              National Renewable<br />Energy Platform
            </p>
          </div>
        </div>

        {/* Main headline */}
        <div>
          <p className="font-display text-5xl font-bold leading-tight text-white">
            Implementation<br />Matrix
          </p>
          <p
            className="mt-6 max-w-md text-sm leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.7)' }}
          >
            Five strategic results. Twenty-seven outputs. Sixty-four targets,
            tracked against the National Renewable Energy Policy Strategic
            Plan — owned section by section.
          </p>
          {/* Amber divider */}
          <div className="mt-8 h-0.5 w-16" style={{ backgroundColor: '#D98E2B' }} />
        </div>

        {/* Footer */}
        <div>
          <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Ministry of Energy and Mineral Development
          </p>
          <p className="mt-1 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Republic of Uganda · Strategic Plan 2023–2028
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex w-full items-center justify-center bg-parchment p-8 lg:w-1/2">
        {/* Mobile logo (only visible on small screens) */}
        <div className="absolute top-6 left-6 flex items-center gap-2 lg:hidden">
          <img src="/nrep-logo.png" alt="NREP" className="h-8 w-8 object-contain" />
          <span className="font-mono text-xs font-bold" style={{ color: '#054653' }}>NREP</span>
        </div>

        <div className="w-full max-w-sm">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-clay">{eyebrow}</p>
          <h1 className="mt-2 font-display text-3xl text-ink">{title}</h1>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
