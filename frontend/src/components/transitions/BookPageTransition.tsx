"use client";

import React, { useEffect, useRef, useState } from "react";

interface BookPageTransitionProps {
  frontPage: React.ReactNode;
  underlyingContent: React.ReactNode;
  onExploreWorkspace?: () => void;
}

/**
 * Realistic 3D Book Page-Flip Transition Component
 *
 * Implements a physically modeled right-to-left flexible book-page turn
 * driven continuously by user scroll progress.
 *
 * Features:
 * 1. Traveling cylindrical fold wave from right (100%) to left (0%).
 * 2. Front surface (Solar System) stays live and crops progressively at the curl line without GPU context loss.
 * 3. 3D arched cylinder along the fold with specular ridge sheen and trough shadows.
 * 4. Turned reverse flap showing luxury obsidian hardcover bookplate with debossed gold astrolabe seal.
 * 5. Automatic fade-out of reverse flap past 80% so workspace is completely clean.
 * 6. Always opens to Solar System cover on page load/refresh (scrollRestoration = manual).
 * 7. Guaranteed 2-way navigation: clicks on header/buttons work at all times.
 * 8. Window-level scroll chaining for smooth reversible scrolling in both directions.
 */
export function BookPageTransition({
  frontPage,
  underlyingContent,
}: BookPageTransitionProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stickyViewportRef = useRef<HTMLDivElement | null>(null);
  const frontClipWrapperRef = useRef<HTMLDivElement | null>(null);
  const curlCylinderRef = useRef<HTMLDivElement | null>(null);
  const reverseFlapRef = useRef<HTMLDivElement | null>(null);
  const castShadowRef = useRef<HTMLDivElement | null>(null);
  const underlyingContainerRef = useRef<HTMLDivElement | null>(null);

  const [currentP, setCurrentP] = useState(0);

  useEffect(() => {
    // 1. Ensure page always opens to Solar System cover on refresh / first load
    if (typeof window !== "undefined") {
      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "manual";
      }
      window.scrollTo(0, 0);
    }

    const container = containerRef.current;
    const frontClip = frontClipWrapperRef.current;
    const cylinderEl = curlCylinderRef.current;
    const flapEl = reverseFlapRef.current;
    const shadowEl = castShadowRef.current;
    const underlying = underlyingContainerRef.current;

    if (!container || !frontClip || !cylinderEl || !flapEl || !shadowEl) return;

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

    // Universal wheel chaining: when at top of workspace and scrolling UP, smoothly scroll window up
    const handleGlobalWheel = (e: WheelEvent) => {
      if (underlying && underlying.scrollTop <= 2 && e.deltaY < 0 && targetProgress > 0) {
        window.scrollBy({ top: e.deltaY * 1.5, behavior: "auto" });
      }
    };
    window.addEventListener("wheel", handleGlobalWheel, { passive: true });

    // High-performance 60 FPS render loop outside React state
    const updateTransforms = () => {
      animationFrameId = requestAnimationFrame(updateTransforms);

      // Silky lerp interpolation
      const diff = targetProgress - currentProgress;
      if (Math.abs(diff) > 0.0003) {
        currentProgress += diff * 0.22;
      } else {
        currentProgress = targetProgress;
      }

      const p = currentProgress;

      // 1. Traveling Fold Progress (from 100% right edge to 0% left spine)
      const easedP = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      const foldPercent = (1 - easedP) * 100;

      // Bend factor peaks near mid-turn
      const bend = Math.sin(p * Math.PI);
      const liftZ = bend * 170; // Paper arching toward camera in px
      const cornerTilt = bend * 6.5; // Subtle diagonal corner pull in degrees

      // 2. Front Surface: Progressively reveal underside as sheet peels to left
      if (p <= 0.001) {
        frontClip.style.width = "100%";
        frontClip.style.visibility = "visible";
      } else if (p >= 0.99) {
        frontClip.style.width = "0%";
        frontClip.style.visibility = "hidden";
      } else {
        frontClip.style.visibility = "visible";
        frontClip.style.width = `${foldPercent}%`;
      }

      // 3. 3D Curled Cylinder Spine along the active fold
      if (p > 0.005 && p < 0.95) {
        cylinderEl.style.opacity = `${p > 0.85 ? Math.max(0, (0.95 - p) / 0.1) : 1}`;
        cylinderEl.style.left = `${foldPercent}%`;
        const cylinderAngle = -bend * 32;
        cylinderEl.style.transform = `translateX(-50%) translateZ(${liftZ}px) rotateY(${cylinderAngle}deg) rotateZ(${cornerTilt * 0.4}deg)`;

        // Specular highlight crest and trough shadow along the curve
        cylinderEl.style.background = `linear-gradient(
          to right,
          rgba(0, 0, 0, ${bend * 0.7}) 0%,
          rgba(255, 255, 255, ${bend * 0.35}) 35%,
          rgba(255, 255, 255, ${bend * 0.75}) 48%,
          rgba(0, 0, 0, ${bend * 0.8}) 70%,
          transparent 100%
        )`;
        cylinderEl.style.boxShadow = `0 ${liftZ * 0.3}px ${liftZ * 0.6}px rgba(0, 0, 0, ${bend * 0.7})`;
      } else {
        cylinderEl.style.opacity = "0";
      }

      // 4. Turned Reverse Flap (Luxury Obsidian Hardcover Bookplate)
      // Displays the underside of the curled sheet, then gracefully dissolves past 80% so workspace is clean
      if (p > 0.015 && p < 0.92) {
        // Flap fades out smoothly as page settles onto spine (between p = 0.75 and 0.90)
        const flapOpacity = p < 0.75 ? 1 : Math.max(0, (0.90 - p) / 0.15);
        flapEl.style.opacity = `${flapOpacity}`;
        flapEl.style.visibility = flapOpacity > 0 ? "visible" : "hidden";

        // Flap width tracks peeled paper portion and shrinks cleanly to 0
        const flapWidth = Math.min(foldPercent, Math.max(0, (100 - foldPercent) * 0.45));
        flapEl.style.left = `${Math.max(0, foldPercent - flapWidth)}%`;
        flapEl.style.width = `${flapWidth}%`;

        // 3D rotation and curl angle on the folded sheet facing camera
        const flapAngle = bend * 24;
        const tiltX = bend * -3.5;
        flapEl.style.transform = `translateZ(${liftZ * 0.45}px) rotateY(${flapAngle}deg) rotateX(${tiltX}deg)`;

        // Ambient lighting on reverse side
        const brightness = 0.7 + p * 0.35;
        flapEl.style.filter = `brightness(${brightness})`;
      } else {
        flapEl.style.opacity = "0";
        flapEl.style.visibility = "hidden";
      }

      // 5. Dynamic Cast Shadow on Underlying Workspace
      if (p > 0.015 && p < 0.92) {
        const shadowOpacity = p < 0.8 ? 1 : Math.max(0, (0.92 - p) / 0.12);
        shadowEl.style.opacity = `${shadowOpacity}`;
        shadowEl.style.left = `${foldPercent}%`;
        shadowEl.style.background = `linear-gradient(
          to right,
          rgba(0, 0, 0, ${bend * 0.85}) 0%,
          rgba(0, 0, 0, ${bend * 0.45}) 25%,
          rgba(0, 0, 0, ${bend * 0.15}) 60%,
          transparent 100%
        )`;
      } else {
        shadowEl.style.opacity = "0";
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
      style={{ height: "240vh" }} // 2.4x viewport height for authentic physical scroll feel
    >
      {/* Pinned Sticky Viewport */}
      <div
        ref={stickyViewportRef}
        className="sticky top-0 h-screen w-full overflow-hidden"
        style={{ perspective: "2600px", perspectiveOrigin: "50% 50%" }}
      >
        {/* ============================================================== */}
        {/* 1. Underlying Working Interface (Present underneath page)       */}
        {/* Always receives pointer-events so clicks are never blocked!    */}
        {/* ============================================================== */}
        <div
          id="cf-workspace-scroll"
          ref={underlyingContainerRef}
          className="absolute inset-0 h-full w-full overflow-y-auto bg-[#090a0d] pointer-events-auto"
          style={{ zIndex: 1 }}
        >
          {underlyingContent}

          {/* Dynamic Cast Shadow cast by turning sheet onto revealed workspace */}
          <div
            ref={castShadowRef}
            className="pointer-events-none absolute bottom-0 right-0 top-0 transition-opacity duration-75"
            style={{ zIndex: 25, opacity: 0 }}
          />
        </div>

        {/* ============================================================== */}
        {/* 2. Front Surface: Live Interactive Solar System                */}
        {/* Cropped cleanly along the advancing fold without GPU crash     */}
        {/* ============================================================== */}
        <div
          ref={frontClipWrapperRef}
          className="absolute inset-y-0 left-0 overflow-hidden"
          style={{ width: "100%", zIndex: 10 }}
        >
          <div
            className="h-full w-screen overflow-hidden bg-[#06080d]"
            style={{ width: "100vw", minWidth: "100vw", height: "100vh" }}
          >
            {frontPage}
          </div>
        </div>

        {/* ============================================================== */}
        {/* 3. Dynamic 3D Curled Cylinder Spine (Ridge Sheen & Trough)     */}
        {/* ============================================================== */}
        <div
          ref={curlCylinderRef}
          className="pointer-events-none absolute bottom-0 top-0 w-32 -translate-x-1/2 transition-opacity duration-75 will-change-transform"
          style={{
            zIndex: 30,
            opacity: 0,
            transformStyle: "preserve-3d",
          }}
        />

        {/* ============================================================== */}
        {/* 4. Turned Reverse Flap: Luxury Obsidian Bookplate             */}
        {/* ============================================================== */}
        <div
          ref={reverseFlapRef}
          className="pointer-events-none absolute bottom-0 top-0 flex flex-col justify-between overflow-hidden border-r border-white/[0.12] bg-[#0c0e17] p-8 select-none transition-opacity duration-75 will-change-transform shadow-[-18px_0_35px_rgba(0,0,0,0.85)]"
          style={{
            zIndex: 20,
            opacity: 0,
            transformStyle: "preserve-3d",
            transformOrigin: "right center",
          }}
        >
          {/* Paper Micro-Texture Watermark */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
              backgroundSize: "24px 24px",
            }}
          />

          {/* Book Margin Rule Lines */}
          <div className="pointer-events-none absolute inset-6 rounded-lg border border-white/[0.06]" />

          {/* Spine Binding Shading (Near right fold) */}
          <div className="pointer-events-none absolute bottom-0 right-0 top-0 w-24 bg-gradient-to-l from-black/90 via-black/40 to-transparent" />

          {/* Top Folio Header */}
          <div className="relative z-10 flex items-center justify-between border-b border-white/[0.08] pb-3 font-mono text-[10px] tracking-widest text-neutral-500 uppercase">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500/80" />
              <span>CodeForge AI Autonomous Engineering</span>
            </div>
            <span>Folio I · Section 02</span>
          </div>

          {/* Center Debossed Gold-Leaf Insignia */}
          <div className="relative z-10 mx-auto my-auto max-w-sm text-center">
            {/* Geometric Astrolabe Seal */}
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/[0.03] shadow-[0_0_24px_rgba(245,158,11,0.08)]">
              <svg
                className="h-8 w-8 text-amber-400/85"
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

            <h2 className="font-mono text-xs tracking-[0.3em] uppercase text-neutral-300">
              CodeForge AI
            </h2>
            <p className="mt-1 text-[11px] font-mono text-neutral-500">
              Deterministic Multi-Agent Orchestration
            </p>
            <div className="mx-auto mt-3 h-[1px] w-20 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
            <p className="mt-3 font-mono text-[10px] leading-relaxed text-neutral-400">
              Turn page to enter active workspace console, execute autonomous workflows, and review deterministic multi-agent synthesis.
            </p>
          </div>

          {/* Bottom Folio Footer */}
          <div className="relative z-10 flex items-center justify-between border-t border-white/[0.08] pt-3 font-mono text-[10px] tracking-widest text-neutral-500 uppercase">
            <span>LangGraph Determinism</span>
            <span>Workspace Genesis →</span>
          </div>
        </div>
      </div>
    </div>
  );
}