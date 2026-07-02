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
    <div className="flex min-h-screen bg-ink">
      <div className="hidden w-1/2 flex-col justify-between bg-ink p-12 text-parchment lg:flex">
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-amber">
          NREP - Strategic Plan
        </div>
        <div>
          <p className="font-display text-5xl leading-tight">
            Implementation
            <br />
            Matrix
          </p>
          <p className="mt-6 max-w-md font-body text-sm leading-relaxed text-parchment/70">
            Five strategic results. Twenty-seven outputs. Sixty-four targets, tracked against the
            National Renewable Energy Policy Strategic Plan, owned section by section.
          </p>
        </div>
        <div className="font-mono text-xs text-parchment/40">
          Ministry of Energy and Mineral Development
        </div>
      </div>
      <div className="flex w-full items-center justify-center bg-parchment p-8 lg:w-1/2">
        <div className="w-full max-w-sm">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-clay">{eyebrow}</p>
          <h1 className="mt-2 font-display text-3xl text-ink">{title}</h1>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
