import Link from "next/link";

interface AppHeaderProps {
  onBackToSolarSystem?: () => void;
}

export function AppHeader({ onBackToSolarSystem }: AppHeaderProps = {}) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#090a0d]/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4 lg:px-10">
        <div className="flex items-center gap-3">
          {onBackToSolarSystem ? (
            <button
              type="button"
              onClick={onBackToSolarSystem}
              className="flex items-center gap-3 group text-left"
              title="Return to Solar System Cover"
            >
              <span className="grid h-8 w-8 place-items-center rounded-lg border border-white/[0.12] bg-white/[0.04] font-mono text-xs font-semibold text-white transition group-hover:border-amber-400/50 group-hover:bg-amber-500/10">
                CF
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-semibold tracking-tight text-white group-hover:text-amber-300 transition">
                  CodeForge
                </span>
                <span className="text-xs text-muted font-mono">v0.1.0</span>
              </div>
            </button>
          ) : (
            <Link href="/" className="flex items-center gap-3 group">
              <span className="grid h-8 w-8 place-items-center rounded-lg border border-white/[0.12] bg-white/[0.04] font-mono text-xs font-semibold text-white transition group-hover:border-white/30">
                CF
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-semibold tracking-tight text-white">CodeForge</span>
                <span className="text-xs text-muted font-mono">v0.1.0</span>
              </div>
            </Link>
          )}
        </div>
        <nav className="flex items-center gap-6 text-sm text-neutral-400">
          {onBackToSolarSystem && (
            <button
              type="button"
              onClick={onBackToSolarSystem}
              className="flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-mono text-amber-300 transition hover:border-amber-400 hover:bg-amber-500/20 hover:text-white cursor-pointer shadow-[0_0_12px_rgba(245,158,11,0.15)]"
              title="Return to Solar System Cover"
            >
              <span className="text-amber-400">☉</span>
              <span>Solar System Cover</span>
            </button>
          )}
          <Link className="transition hover:text-white" href="/">
            Projects
          </Link>
          <a
            className="transition hover:text-white"
            href="http://127.0.0.1:8000/docs"
            target="_blank"
            rel="noreferrer"
          >
            API Reference
          </a>
        </nav>
      </div>
    </header>
  );
}
