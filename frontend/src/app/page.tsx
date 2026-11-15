import { Dashboard } from "@/components/dashboard/Dashboard";
import { AppHeader } from "@/components/layout/AppHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { AgentForgeScene } from "@/components/visual/AgentForgeScene";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas selection:bg-accent/30 selection:text-foreground">
      <AppHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8 lg:px-10">
        {/* Hero Section with Interactive 3D Multi-Agent Forge */}
        <section className="mb-12 grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3.5 py-1 text-xs font-medium text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              LangGraph Multi-Agent Architecture
            </div>

            <h1 className="mt-4 text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl text-foreground">
              Forge production code with <span className="bg-gradient-to-r from-accent via-sky-300 to-emerald-400 bg-clip-text text-transparent">autonomous AI agents</span>
            </h1>

            <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
              Submit your natural-language software requirements. Watch our specialized agents architect blueprints, decompose tasks, implement source code, and run automated test suites.
            </p>

            {/* Architecture Metrics Badges */}
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-border/70 bg-surface/50 p-3 backdrop-blur-md">
                <span className="block font-mono text-xl font-bold text-accent">4</span>
                <span className="block text-xs text-muted">Specialized Agents</span>
              </div>
              <div className="rounded-xl border border-border/70 bg-surface/50 p-3 backdrop-blur-md">
                <span className="block font-mono text-xl font-bold text-emerald-400">100%</span>
                <span className="block text-xs text-muted">Real Backend Runs</span>
              </div>
              <div className="rounded-xl border border-border/70 bg-surface/50 p-3 backdrop-blur-md">
                <span className="block font-mono text-xl font-bold text-purple-400">Isolated</span>
                <span className="block text-xs text-muted">Code Sandboxes</span>
              </div>
              <div className="rounded-xl border border-border/70 bg-surface/50 p-3 backdrop-blur-md">
                <span className="block font-mono text-xl font-bold text-amber-400">HITL</span>
                <span className="block text-xs text-muted">Approval Gates</span>
              </div>
            </div>
          </div>

          {/* Interactive 3D Three.js Forge Scene */}
          <div className="relative">
            <AgentForgeScene />
          </div>
        </section>

        {/* Dashboard Section */}
        <section className="border-t border-border/70 pt-10">
          <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Workspace Management</p>
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Projects & Workflows</h2>
            </div>
            <StatusBadge tone="success">Engine Online</StatusBadge>
          </div>

          <Dashboard />
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-border/70 bg-surface/30 px-6 py-6 text-sm text-muted backdrop-blur-md lg:px-10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid h-6 w-6 place-items-center rounded-lg border border-accent/40 bg-accent/10 font-mono text-xs text-accent">
              CF
            </span>
            <p>CodeForge AI Autonomous Engineering Platform.</p>
          </div>
          <div className="flex items-center gap-5">
            <a
              className="text-accent underline-offset-4 hover:underline"
              href="http://127.0.0.1:8000/docs"
              target="_blank"
              rel="noreferrer"
            >
              FastAPI Docs
            </a>
            <a
              className="text-accent underline-offset-4 hover:underline"
              href="https://github.com/Kaushal-1925/CodeForge-AI"
              target="_blank"
              rel="noreferrer"
            >
              GitHub Repository
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
