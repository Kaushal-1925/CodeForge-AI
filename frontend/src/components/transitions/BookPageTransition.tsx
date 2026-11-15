"use client";

import React, { useEffect, useRef } from "react";

interface BookPageTransitionProps {
  frontPage: React.ReactNode;
  underlyingContent: React.ReactNode;
  onExploreWorkspace?: () => void;
}

/**
 * Ultra-Smooth 60-120 FPS 3D Book Page-Flip Transition Component
 *
 * Engineered with 100% GPU Compositor Transforms:
 * - ZERO layout reflows (no width, height, top, or left animations).
 * - Single physical sheet turning around its spine with 3D perspective.
 * - Front face: Live interactive Solar System (backfaceVisibility: hidden).
 * - Reverse face: Luxury obsidian bookplate with debossed gold astrolabe seal (rotateY: 180deg).
 * - Cylindrical arching in +Z space, diagonal corner pull, and torsional roll.
 * - Moving specular ridge sheen and dynamic soft cast shadow on the workspace.
 * - Always opens to Solar System cover on refresh / first load (history.scrollRestoration = manual).
 * - Full bi-directional navigation (smooth scroll to top & wheel-up chaining).
 */
export function BookPageTransition({
  frontPage,
  underlyingContent,
}: BookPageTransitionProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stickyViewportRef = useRef<HTMLDivElement | null>(null);
  const pageSheetRef = useRef<HTMLDivElement | null>(null);
  const sheenRef = useRef<HTMLDivElement | null>(null);
  const castShadowRef = useRef<HTMLDivElement | null>(null);
  const underlyingContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // 1. Guarantee page always starts at top on initial load & refresh
    if (typeof window !== "undefined") {
      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "manual";
      }
      window.scrollTo(0, 0);
    }

    const container = containerRef.current;
    const pageSheet = pageSheetRef.current;
    const sheen = sheenRef.current;
    const shadow = castShadowRef.current;
    const underlying = underlyingContainerRef.current;

    if (!container || !pageSheet || !sheen || !shadow) return;

    let targetProgress = 0;
    let currentProgress = 0;
    let animationFrameId: number;

    const handleScroll = () => {
      const rect = container.getBoundingClientRect();
      const scrollableDist = rect.height - window.innerHeight;
      if (scrollableDist <= 0) return;

      const raw = -rect.top / scrollableDist;
      targetProgress = Math.max(0, Math.min(1, raw));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    // Wheel-up chaining: when at top of workspace and scrolling UP, roll the book cover closed
    const handleGlobalWheel = (e: WheelEvent) => {
      if (underlying && underlying.scrollTop <= 2 && e.deltaY < 0 && targetProgress > 0) {
        window.scrollBy({ top: e.deltaY * 1.5, behavior: "auto" });
      }
    };
    window.addEventListener("wheel", handleGlobalWheel, { passive: true });

    // 60-120 FPS GPU Render Loop (Zero DOM layout reflows)
    const updateTransforms = () => {
      animationFrameId = requestAnimationFrame(updateTransforms);

      // Silky smooth momentum lerp
      const diff = targetProgress - currentProgress;
      if (Math.abs(diff) > 0.0002) {
        currentProgress += diff * 0.18;
      } else {
        currentProgress = targetProgress;
      }

      const p = currentProgress;

      // Parabolic 3D bend peaks at mid-turn (p = 0.5)
      const bend = Math.sin(p * Math.PI);
      const tz = bend * 165; // Upward paper arch in +Z (px)
      const rotX = bend * -5.0; // Natural diagonal corner pull (deg)
      const rotZ = bend * 3.8; // Torsional paper twist (deg)

      // 1. GPU Composited Physics Coordinates (Non-linear curvature keeps sheet visible mid-turn)
      const viewWidth = window.innerWidth;
      const tx = p * viewWidth;
      const rotY = -p * 180 + bend * 22;

      // Apply hardware-accelerated 3D transform to turning sheet
      pageSheet.style.transform = `translate3d(${tx}px, 0, ${tz}px) rotateY(${rotY}deg) rotateX(${rotX}deg) rotateZ(${rotZ}deg)`;

      // 2. Dynamic Specular Sheen Wave along Curvature
      if (p > 0.01 && p < 0.97) {
        sheen.style.opacity = `${bend * 0.7}`;
        // Move light sweep across the paper as it bends
        const sheenX = (1 - p) * 100;
        sheen.style.background = `linear-gradient(
          to right,
          transparent ${Math.max(0, sheenX - 30)}%,
          rgba(255, 255, 255, 0.28) ${sheenX}%,
          rgba(0, 0, 0, 0.45) ${Math.min(100, sheenX + 15)}%,
          transparent ${Math.min(100, sheenX + 35)}%
        )`;
      } else {
        sheen.style.opacity = "0";
      }

      // 3. Dynamic Soft Cast Shadow on Revealed Workspace
      if (p > 0.02 && p < 0.98) {
        shadow.style.opacity = `${bend * 0.75}`;
        const shadowX = p * 100;
        shadow.style.background = `linear-gradient(
          to right,
          rgba(0, 0, 0, 0.75) 0%,
          rgba(0, 0, 0, 0.35) ${Math.max(0, shadowX - 15)}%,
          rgba(0, 0, 0, 0.12) ${shadowX}%,
          transparent ${Math.min(100, shadowX + 25)}%
        )`;
      } else {
        shadow.style.opacity = "0";
      }

      // 4. Clean Settled State: Hide sheet completely once turn is finished
      if (p >= 0.96) {
        const fade = Math.max(0, (1 - p) / 0.04);
        pageSheet.style.opacity = `${fade}`;
        pageSheet.style.visibility = p >= 0.998 ? "hidden" : "visible";
      } else {
        pageSheet.style.opacity = "1";
        pageSheet.style.visibility = "visible";
      }
    };

    updateTransforms();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("wheel", handleGlobalWheel);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{ height: "240vh" }} // 2.4x viewport height gives natural physical resistance
    >
      {/* Pinned Sticky Viewport with High-Precision 3D Perspective */}
      <div
        ref={stickyViewportRef}
        className="sticky top-0 h-screen w-full overflow-hidden"
        style={{
          perspective: "2400px",
          perspectiveOrigin: "50% 50%",
        }}
      >
        {/* ============================================================== */}
        {/* 1. Underlying Working Interface (Always present beneath page)   */}
        {/* ============================================================== */}
        <div
          id="cf-workspace-scroll"
          ref={underlyingContainerRef}
          className="absolute inset-0 h-full w-full overflow-y-auto bg-[#090a0d] pointer-events-auto"
          style={{ zIndex: 1 }}
        >
          {underlyingContent}

          {/* Dynamic Cast Shadow sweeping over workspace */}
          <div
            ref={castShadowRef}
            className="pointer-events-none absolute inset-0 transition-opacity duration-75"
            style={{ zIndex: 20, opacity: 0 }}
          />
        </div>

        {/* ============================================================== */}
        {/* 2. Turning Hardcover Book Sheet (100% GPU Composited)          */}
        {/* ============================================================== */}
        <div
          ref={pageSheetRef}
          className="absolute inset-0 h-full w-full will-change-transform"
          style={{
            transformStyle: "preserve-3d",
            transformOrigin: "left center", // Spine anchored at left
            zIndex: 10,
          }}
        >
          {/* ------------------------------------------------------------ */}
          {/* Front Face: Live Interactive 3D Solar System (rotateY: 0deg) */}
          {/* ------------------------------------------------------------ */}
          <div
            className="absolute inset-0 h-full w-full overflow-hidden bg-[#06080d]"
            style={{
              transform: "rotateY(0deg)",
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
            }}
          >
            {frontPage}

            {/* Specular Ridge Curvature Sheen */}
            <div
              ref={sheenRef}
              className="pointer-events-none absolute inset-0 transition-opacity duration-75"
              style={{ opacity: 0 }}
            />

            {/* Fine Right Paper Edge Thickness / Bevel */}
            <div className="pointer-events-none absolute bottom-0 right-0 top-0 w-[2px] bg-gradient-to-l from-white/30 to-transparent shadow-[0_0_12px_rgba(255,255,255,0.2)]" />
          </div>

          {/* ------------------------------------------------------------ */}
          {/* Reverse Face: Luxury Obsidian Bookplate (rotateY: 180deg)   */}
          {/* ------------------------------------------------------------ */}
          <div
            className="absolute inset-0 flex h-full w-full flex-col justify-between overflow-hidden border-l border-white/[0.12] bg-[#0c0e17] p-10 select-none shadow-[0_20px_60px_rgba(0,0,0,0.9)]"
            style={{
              transform: "rotateY(180deg) translateZ(1px)",
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
            }}
          >
            {/* Paper Micro-Texture Watermark */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
                backgroundSize: "28px 28px",
              }}
            />

            {/* Spine Binding Shading (Near right edge when flipped) */}
            <div className="pointer-events-none absolute bottom-0 right-0 top-0 w-28 bg-gradient-to-l from-black/90 via-black/40 to-transparent" />

            {/* Book Margin Rule Lines */}
            <div className="pointer-events-none absolute inset-8 rounded-xl border border-white/[0.06]" />

            {/* Top Folio Header */}
            <div className="relative z-10 flex items-center justify-between border-b border-white/[0.08] pb-4 font-mono text-[10px] tracking-widest text-neutral-500 uppercase">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500/80" />
                <span>CodeForge AI Autonomous Engineering</span>
              </div>
              <span>Folio I · Section 02</span>
            </div>

            {/* Center Debossed Gold-Leaf Insignia */}
            <div className="relative z-10 mx-auto my-auto max-w-md text-center">
              {/* Geometric Astrolabe Seal */}
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/[0.03] shadow-[0_0_30px_rgba(245,158,11,0.08)]">
                <svg
                  className="h-10 w-10 text-amber-400/85"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.2"
                >
                  <circle cx="12" cy="12" r="9" strokeDasharray="2 2" />
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 3v18M3 12h18M6.5 6.5l11 11M6.5 17.5l11-11" />
                </svg>
              </div>

              <h2 className="font-mono text-sm tracking-[0.3em] uppercase text-neutral-300">
                CodeForge AI
              </h2>
              <p className="mt-2 text-xs font-mono text-neutral-500">
                Deterministic Multi-Agent Orchestration
              </p>
              <div className="mx-auto mt-4 h-[1px] w-24 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
              <p className="mt-4 font-mono text-[11px] leading-relaxed text-neutral-400">
                Turn the page to enter the active workspace console, execute autonomous workflows, and monitor deterministic multi-agent synthesis.
              </p>
            </div>

            {/* Bottom Folio Footer */}
            <div className="relative z-10 flex items-center justify-between border-t border-white/[0.08] pt-4 font-mono text-[10px] tracking-widest text-neutral-500 uppercase">
              <span>LangGraph Determinism</span>
              <span>Workspace Genesis →</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}