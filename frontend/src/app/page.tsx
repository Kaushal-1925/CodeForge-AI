"use client";

import { Dashboard } from "@/components/dashboard/Dashboard";
import { AppHeader } from "@/components/layout/AppHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SolarAgentSystem } from "@/components/visual/SolarAgentSystem";
import { BookPageTransition } from "@/components/transitions/BookPageTransition";

export default function HomePage() {
  const scrollToWorkspace = () => {
    if (typeof window !== "undefined") {
      const targetY = window.innerHeight * 0.65;
      const startY = window.scrollY;
      const diff = targetY - startY;
      if (Math.abs(diff) < 2) return;
      const startTime = performance.now();
      const duration = 380; // Crisp 380ms forward page turn

      const step = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);
        const ease =
          progress < 0.5
            ? 4 * progress * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        window.scrollTo(0, startY + diff * ease);
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          window.scrollTo(0, targetY);
        }
      };
      requestAnimationFrame(step);
    }
  };

  const scrollToSolarSystem = () => {
    if (typeof window !== "undefined") {
      const underlying = document.getElementById("cf-workspace-scroll");
      if (underlying) {
        underlying.scrollTo({ top: 0, behavior: "instant" });
      }

      const startY = window.scrollY;
      if (startY <= 0) {
        window.scrollTo(0, 0);
        return;
      }

      const startTime = performance.now();
      const duration = 320; // Swift 320ms return to cover

      const step = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);
        // Snappy cubic ease-out
        const ease = 1 - Math.pow(1 - progress, 3);
        window.scrollTo(0, startY * (1 - ease));
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          window.scrollTo(0, 0);
        }
      };
      requestAnimationFrame(step);
    }
  };

  return (
    <BookPageTransition
      frontPage={
        <SolarAgentSystem onExploreWorkspace={scrollToWorkspace} />
      }
      underlyingContent={
        <div className="flex min-h-screen flex-col bg-[#090a0d] text-foreground relative">
          {/* 1. Workspace Navigation Bar */}
          <AppHeader onBackToSolarSystem={scrollToSolarSystem} />

          {/* 2. Floating Return to Cover Button for instant 1-click return */}
          <div className="fixed bottom-6 right-6 z-50">
            <button
              type="button"
              onClick={scrollToSolarSystem}
              className="flex items-center gap-2 rounded-full border border-amber-500/40 bg-[#12141c]/90 px-4 py-2.5 font-mono text-xs font-medium text-amber-300 shadow-[0_8px_24px_rgba(0,0,0,0.6)] backdrop-blur-xl transition hover:border-amber-400 hover:bg-amber-500/20 hover:text-white hover:scale-105 active:scale-95 cursor-pointer"
              title="Flip back to Solar System Cover"
            >
              <span className="text-amber-400">←</span>
              <span>☉ Solar System Cover</span>
            </button>
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

          {/* 3. Minimalist Glass Footer */}
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
                  className="text-neutral-400 transition hover:text-amber-400 font-mono text-xs"
                >
                  ☉ Solar System Cover
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
        </div>
      }
    />
  );
}
