import { Dashboard } from "@/components/dashboard/Dashboard";
import { AppHeader } from "@/components/layout/AppHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10 lg:px-10">
        <header className="mb-10 flex flex-col gap-4 border-b border-border/70 pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
              Autonomous engineering
            </p>
            <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
              Workflow dashboard
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-muted">
              Create a project, submit a natural-language request, and follow the agents as they
              plan, implement, validate, and test the generated software. Every status shown here
              comes from the backend.
            </p>
          </div>
          <StatusBadge tone="success">Backend integrated</StatusBadge>
        </header>

        <Dashboard />
      </main>

      <footer className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 border-t border-border/70 px-6 py-6 text-sm text-muted lg:px-10">
        <p>CodeForge AI is under active development. No results are simulated.</p>
        <a
          className="text-accent underline-offset-4 hover:underline"
          href="https://github.com/Kaushal-1925/CodeForge-AI"
          target="_blank"
          rel="noreferrer"
        >
          GitHub repository
        </a>
      </footer>
    </div>
  );
}
