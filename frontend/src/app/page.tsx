"use client";

import { useRef } from "react";

import { Dashboard } from "@/components/dashboard/Dashboard";
import { AppHeader } from "@/components/layout/AppHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SolarAgentSystem } from "@/components/visual/SolarAgentSystem";

export default function HomePage() {
  const workspaceRef = useRef<HTMLDivElement | null>(null);

  const scrollToWorkspace = () => {
    if (workspaceRef.current) {
      workspaceRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#090a0d] text-foreground">
      {/* 1. Full-Page 3D Solar System Experience */}
      <SolarAgentSystem onExploreWorkspace={scrollToWorkspace} />

      {/* 2. Workspace Navigation Bar */}
      <div ref={workspaceRef} className="scroll-mt-6">
        <AppHeader />
      </div>

      {/* 3. Projects & Workflows Workspace */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12 lg:px-10">
        <section className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.06] pb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <p className="text-xs font-mono uppercase tracking-widest text-neutral-500">
                Workspace Console
              </p>
            </div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Projects &amp; Workflow Runs
            </h2>
            <p className="mt-1 text-sm text-neutral-400">
              Submit your natural-language requirements to orchestrate the solar agents through architecture, tasks, code, and verification.
            </p>
          </div>
          <StatusBadge tone="success">Engine Online</StatusBadge>
        </section>

        <Dashboard />
      </main>

      {/* 4. Minimalist Glass Footer */}
      <footer className="mt-auto border-t border-white/[0.06] bg-black/40 px-6 py-6 text-xs text-neutral-500 backdrop-blur-xl lg:px-10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-400">CodeForge AI</span>
            <span>·</span>
            <span>Deterministic multi-agent execution powered by LangGraph &amp; FastAPI</span>
          </div>
          <div className="flex items-center gap-5">
            <a
              className="text-neutral-400 transition hover:text-white"
              href="http://127.0.0.1:8000/docs"
              target="_blank"
              rel="noreferrer"
            >
              FastAPI Reference
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
