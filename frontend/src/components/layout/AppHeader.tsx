import Link from "next/link";

export function AppHeader() {
  return (
    <header className="border-b border-border/70">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5 lg:px-10">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl border border-accent/30 bg-accent/10 font-mono text-xs text-accent">
            CF
          </span>
          <span>
            <span className="block text-sm font-semibold tracking-tight">CodeForge AI</span>
            <span className="block text-xs text-muted">Workflow dashboard</span>
          </span>
        </Link>
        <nav className="flex items-center gap-5 text-sm text-muted">
          <Link className="transition hover:text-foreground" href="/">
            Projects
          </Link>
          <a
            className="transition hover:text-foreground"
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noreferrer"
          >
            API docs
          </a>
        </nav>
      </div>
    </header>
  );
}
