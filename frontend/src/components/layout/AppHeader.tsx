import Link from "next/link";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#090a0d]/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4 lg:px-10">
        <Link href="/" className="flex items-center gap-3 group">
          <span className="grid h-8 w-8 place-items-center rounded-lg border border-white/[0.12] bg-white/[0.04] font-mono text-xs font-semibold text-white transition group-hover:border-white/30">
            CF
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold tracking-tight text-white">CodeForge</span>
            <span className="text-xs text-muted font-mono">v0.1.0</span>
          </div>
        </Link>
        <nav className="flex items-center gap-6 text-sm text-neutral-400">
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
