import { Dashboard } from "@/components/dashboard/Dashboard";
import { AppHeader } from "@/components/layout/AppHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { AgentForgeScene } from "@/components/visual/AgentForgeScene";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#090a0d] text-foreground">
      <AppHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12 lg:px-10">
        {/* Hero Section */}
        <section className="mb-14 grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs font-mono text-neutral-400 backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Multi-Agent Orchestration
            </div>

            <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-5xl">
              Autonomous software engineering platform
            </h1>

            <p className="mt-4 max-w-xl text-base leading-relaxed text-neutral-400">
              Submit requirements and follow specialized agents through architecture design, task decomposition, code generation, and automated test execution.
            </p>

            {/* Architecture Metrics */}
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5 backdrop-blur-md">
                <span className="block font-mono text-lg font-semibold text-white">4</span>
                <span className="mt-0.5 block text-xs text-neutral-400">Agents</span>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5 backdrop-blur-md">
                <span className="block font-mono text-lg font-semibold text-white">LangGraph</span>
                <span className="mt-0.5 block text-xs text-neutral-400">State Machine</span>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5 backdrop-blur-md">
                <span className="block font-mono text-lg font-semibold text-white">Pytest</span>
                <span className="mt-0.5 block text-xs text-neutral-400">Automated Tests</span>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5 backdrop-blur-md">
                <span className="block font-mono text-lg font-semibold text-white">HITL</span>
                <span className="mt-0.5 block text-xs text-neutral-400">Approval Gate</span>
              </div>
            </div>
          </div>

          {/* Minimalist 3D Three.js Forge Scene */}
          <div className="relative">
            <AgentForgeScene />
          </div>
        </section>

        {/* Dashboard Workspace */}
        <section className="border-t border-white/[0.06] pt-10">
          <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Workspace</p>
              <h2 className="text-2xl font-semibold tracking-tight text-white">Projects & Runs</h2>
            </div>
            <StatusBadge tone="success">Engine Ready</StatusBadge>
          </div>

          <Dashboard />
        </section>
      </main>

      {/* Minimal Footer */}
      <footer className="mt-auto border-t border-white/[0.06] bg-black/30 px-6 py-6 text-xs text-neutral-500 backdrop-blur-md lg:px-10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-400">CodeForge AI</span>
            <span>·</span>
            <span>Deterministic multi-agent execution</span>
          </div>
          <div className="flex items-center gap-5">
            <a
              className="text-neutral-400 transition hover:text-white"
              href="http://127.0.0.1:8000/docs"
              target="_blank"
              rel="noreferrer"
            >
              API Reference
            </a>
            <a
              className="text-neutral-400 transition hover:text-white"
              href="https://github.com/Kaushal-1925/CodeForge-AI"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
