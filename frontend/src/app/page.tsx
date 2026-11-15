"use client";

import { useEffect, useState } from "react";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { AppHeader } from "@/components/layout/AppHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SolarAgentSystem } from "@/components/visual/SolarAgentSystem";

export default function HomePage() {
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToWorkspace = () => {
    if (typeof window !== "undefined") {
      const workspaceEl = document.getElementById("workspace");
      if (workspaceEl) {
        workspaceEl.scrollIntoView({ behavior: "smooth" });
      } else {
        window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
      }
    }
  };

  const scrollToSolarSystem = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#06080d] text-foreground">
      {/* 1. Immersive 3D Solar System Landing Section */}
      <section id="solar-system" className="relative h-screen w-full overflow-hidden">
        <SolarAgentSystem onExploreWorkspace={scrollToWorkspace} />
      </section>

      {/* 2. Projects & Workflows Workspace Section */}
      <section
        id="workspace"
        className="relative min-h-screen w-full bg-[#090a0d] border-t border-white/[0.06] flex flex-col"
      >
        {/* Workspace Navigation Bar */}
        <AppHeader onBackToSolarSystem={scrollToSolarSystem} />

        {/* Floating Return to Solar System Button (only visible when in workspace) */}
        {showBackToTop && (
          <div className="fixed bottom-6 right-6 z-50 transition-all duration-300">
            <button
              type="button"
              onClick={scrollToSolarSystem}
              className="flex items-center gap-2 rounded-full border border-amber-500/40 bg-[#12141c]/90 px-4 py-2.5 font-mono text-xs font-medium text-amber-300 shadow-[0_8px_24px_rgba(0,0,0,0.6)] backdrop-blur-xl transition hover:border-amber-400 hover:bg-amber-500/20 hover:text-white hover:scale-105 active:scale-95 cursor-pointer"
              title="Return to Solar System Cover"
            >
              <span className="text-amber-400">↑</span>
              <span>☉ Solar System</span>
            </button>
          </div>
        )}

        {/* Projects & Workflows Workspace Content */}
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

        {/* Minimalist Glass Footer */}
        <footer className="mt-auto border-t border-white/[0.06] bg-black/40 px-6 py-6 text-xs text-neutral-500 backdrop-blur-xl lg:px-10">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-neutral-400">CodeForge AI</span>
              <span>·</span>
              <span>Deterministic multi-agent execution powered by LangGraph &amp; FastAPI</span>
            </div>
            <div className="flex items-center gap-5">
              <button
                type="button"
                onClick={scrollToSolarSystem}
                className="text-neutral-400 transition hover:text-amber-400 font-mono text-xs cursor-pointer"
              >
                ☉ Solar System
              </button>
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
      </section>
    </div>
  );
}
