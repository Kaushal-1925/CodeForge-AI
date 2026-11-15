"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export type AgentKey = "architect" | "tech_lead" | "developer" | "tester";

export interface AgentPlanetInfo {
  key: AgentKey;
  name: string;
  callsign: string;
  role: string;
  orbitIndex: number;
  orbitRadius: number;
  orbitSpeed: number; // rad/s
  inclination: number; // tilt radians
  planetRadius: number;
  baseColor: string;
  hexColor: number;
  hasRing?: boolean;
  hasMoon?: boolean;
  tagline: string;
  responsibilities: string[];
  inputs: string[];
  outputs: string[];
  langgraphRole: string;
}

export const AGENT_PLANETS: Record<AgentKey, AgentPlanetInfo> = {
  architect: {
    key: "architect",
    name: "Architect Agent",
    callsign: "PLANET ARCHITECT · ORBIT I",
    role: "System Architecture & System Contracts",
    orbitIndex: 1,
    orbitRadius: 4.2,
    orbitSpeed: 0.38,
    inclination: 0.12,
    planetRadius: 0.36,
    baseColor: "#60a5fa",
    hexColor: 0x60a5fa,
    hasRing: true,
    tagline: "Translates human intent into mathematically sound software blueprints.",
    responsibilities: [
      "Deconstructs natural-language prompts into functional engineering specifications.",
      "Designs data models, database schemas, and RESTful API route contracts.",
      "Selects architectural patterns, module boundaries, and external dependencies.",
      "Validates technology stack constraints before any code is authored.",
    ],
    inputs: ["User requirements", "Project constraints", "Approved technology stack"],
    outputs: ["architecture.md blueprint", "SQL schema definitions", "Pydantic contract models"],
    langgraphRole: "First node in LangGraph state machine. Produces state['architecture'].",
  },
  tech_lead: {
    key: "tech_lead",
    name: "Tech Lead Agent",
    callsign: "PLANET TECH LEAD · ORBIT II",
    role: "Task Decomposition & Dependency Strategy",
    orbitIndex: 2,
    orbitRadius: 6.4,
    orbitSpeed: 0.26,
    inclination: -0.16,
    planetRadius: 0.32,
    baseColor: "#34d399",
    hexColor: 0x34d399,
    hasMoon: true,
    tagline: "Transforms complex architectures into parallel, verified engineering tasks.",
    responsibilities: [
      "Parses architectural blueprints into atomic, dependency-ordered work units.",
      "Sets precise acceptance criteria and file boundaries for each task.",
      "Controls the iteration loop, retry logic, and fallback pathways.",
      "Determines when code generation has satisfied all project requirements.",
    ],
    inputs: ["Validated architecture blueprint", "System component contracts"],
    outputs: ["tasks.json task queue", "Acceptance criteria", "Execution order DAG"],
    langgraphRole: "Second node in LangGraph. Populates state['tasks'] and advances state['current_task_index'].",
  },
  developer: {
    key: "developer",
    name: "Developer Agent",
    callsign: "PLANET DEVELOPER · ORBIT III",
    role: "Full-Stack Implementation & File Generation",
    orbitIndex: 3,
    orbitRadius: 8.8,
    orbitSpeed: 0.17,
    inclination: 0.22,
    planetRadius: 0.44,
    baseColor: "#c084fc",
    hexColor: 0xc084fc,
    hasRing: true,
    tagline: "Executes engineering tasks, writing production-grade source code.",
    responsibilities: [
      "Generates typed backend modules, database models, and service business logic.",
      "Creates configuration manifests (pyproject.toml, requirements, environment templates).",
      "Performs self-healing iterations when code validators flag syntax or import errors.",
      "Maintains clean workspace file trees in isolated runtime directories.",
    ],
    inputs: ["Current task item", "Architecture contract", "Existing workspace file tree"],
    outputs: ["Production source files (.py, .ts)", "Module configurations", "Directory structure"],
    langgraphRole: "Iterative execution node. Writes to state['files'] until all tasks are complete.",
  },
  tester: {
    key: "tester",
    name: "Tester Agent",
    callsign: "PLANET TESTER · ORBIT IV",
    role: "Automated Test Suite Generation & Verification",
    orbitIndex: 4,
    orbitRadius: 11.2,
    orbitSpeed: 0.11,
    inclination: -0.09,
    planetRadius: 0.38,
    baseColor: "#fbbf24",
    hexColor: 0xfbbf24,
    hasRing: false,
    tagline: "Ensures defect-free software by synthesizing and executing comprehensive test suites.",
    responsibilities: [
      "Synthesizes exhaustive pytest suites testing happy paths, edge cases, and error branches.",
      "Executes tests inside sandboxed environments and captures stdout/stderr execution traces.",
      "Analyzes failure traces to diagnose root causes and reports fixes back to the Developer.",
      "Enforces the final quality gate before human-in-the-loop review.",
    ],
    inputs: ["Generated source code", "Component contracts", "Task requirements"],
    outputs: ["test_*.py test suites", "Pytest execution metrics", "Diagnostic trace logs"],
    langgraphRole: "Quality verification node. Populates state['test_results'] and gates run completion.",
  },
};

interface SolarAgentSystemProps {
  onExploreWorkspace?: () => void;
}

export function SolarAgentSystem({ onExploreWorkspace }: SolarAgentSystemProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<AgentPlanetInfo | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check WebGL availability
    const testCanvas = document.createElement("canvas");
    const gl =
      testCanvas.getContext("webgl") || testCanvas.getContext("experimental-webgl");
    if (!gl) {
      setIsSupported(false);
      return;
    }

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    // Scene & Deep Space Camera
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x090a0d, 0.025);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 200);
    camera.position.set(0, 11, 20);
    camera.lookAt(0, 0, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // 1. Ambient & Solar Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
    scene.add(ambientLight);

    // Sun Point Light (illuminates the dark sides of planets realistically)
    const sunLight = new THREE.PointLight(0xfff7ed, 4.5, 60, 0.8);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);

    // Secondary subtle fill light
    const fillLight = new THREE.DirectionalLight(0x94a3b8, 0.4);
    fillLight.position.set(0, 20, 10);
    scene.add(fillLight);

    // 2. Central Radiant Sun (The Orchestrator / State Machine Core)
    const sunGroup = new THREE.Group();
    scene.add(sunGroup);

    // Sun core mesh
    const sunGeo = new THREE.SphereGeometry(1.4, 32, 32);
    const sunMat = new THREE.MeshBasicMaterial({
      color: 0xffedd5,
    });
    const sunMesh = new THREE.Mesh(sunGeo, sunMat);
    sunGroup.add(sunMesh);

    // Sun Corona / Inner Glow
    const coronaGeo = new THREE.SphereGeometry(1.65, 32, 32);
    const coronaMat = new THREE.MeshBasicMaterial({
      color: 0xfdba74,
      transparent: true,
      opacity: 0.35,
      side: THREE.BackSide,
    });
    const coronaMesh = new THREE.Mesh(coronaGeo, coronaMat);
    sunGroup.add(coronaMesh);

    // Outer Solar Flare Ring
    const flareGeo = new THREE.RingGeometry(1.6, 2.3, 64);
    const flareMat = new THREE.MeshBasicMaterial({
      color: 0xffedd5,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide,
    });
    const flareMesh = new THREE.Mesh(flareGeo, flareMat);
    flareMesh.rotation.x = Math.PI / 2;
    sunGroup.add(flareMesh);

    // 3. Stellar Dust / Cosmic Starfield (1,200 stars)
    const starCount = 1200;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 120;
      starPositions[i + 1] = (Math.random() - 0.5) * 80;
      starPositions[i + 2] = (Math.random() - 0.5) * 120;
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.05,
      transparent: true,
      opacity: 0.5,
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // 4. Planet Meshes & Orbits
    const planetEntries = Object.values(AGENT_PLANETS);
    const planetMeshes: Array<{
      info: AgentPlanetInfo;
      mesh: THREE.Mesh;
      group: THREE.Group;
      moon?: THREE.Mesh;
      currentAngle: number;
    }> = [];

    planetEntries.forEach((info) => {
      // Orbital Elliptical Path (Hairline 3D Ring)
      const orbitCurve = new THREE.EllipseCurve(
        0,
        0,
        info.orbitRadius,
        info.orbitRadius,
        0,
        2 * Math.PI,
        false,
        0,
      );
      const points = orbitCurve.getPoints(128);
      const orbitGeo = new THREE.BufferGeometry().setFromPoints(
        points.map((p) => new THREE.Vector3(p.x, 0, p.y)),
      );
      const orbitMat = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.08,
      });
      const orbitLine = new THREE.LineLoop(orbitGeo, orbitMat);
      orbitLine.rotation.x = info.inclination;
      scene.add(orbitLine);

      // Planet Group
      const planetGroup = new THREE.Group();
      scene.add(planetGroup);

      // Planet Sphere
      const pGeo = new THREE.SphereGeometry(info.planetRadius, 32, 32);
      const pMat = new THREE.MeshStandardMaterial({
        color: info.hexColor,
        roughness: 0.45,
        metalness: 0.7,
        emissive: info.hexColor,
        emissiveIntensity: 0.25,
      });
      const pMesh = new THREE.Mesh(pGeo, pMat);
      pMesh.userData = { agentKey: info.key };
      planetGroup.add(pMesh);

      // Planetary Rings (e.g. Architect and Developer)
      if (info.hasRing) {
        const ringGeo = new THREE.RingGeometry(
          info.planetRadius * 1.4,
          info.planetRadius * 2.1,
          32,
        );
        const ringMat = new THREE.MeshBasicMaterial({
          color: info.hexColor,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.35,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2.5;
        pMesh.add(ring);
      }

      // Moon Satellite (e.g. Tech Lead)
      let moonMesh: THREE.Mesh | undefined;
      if (info.hasMoon) {
        const mGeo = new THREE.SphereGeometry(info.planetRadius * 0.28, 16, 16);
        const mMat = new THREE.MeshStandardMaterial({
          color: 0xe2e8f0,
          roughness: 0.7,
          metalness: 0.2,
        });
        moonMesh = new THREE.Mesh(mGeo, mMat);
        moonMesh.position.set(info.planetRadius * 1.8, 0, 0);
        planetGroup.add(moonMesh);
      }

      // Random starting angle for realistic asynchronicity
      const startingAngle = (info.orbitIndex * Math.PI) / 2.2;

      planetMeshes.push({
        info,
        mesh: pMesh,
        group: planetGroup,
        moon: moonMesh,
        currentAngle: startingAngle,
      });
    });

    // 5. Interactive Raycaster for CLICK Detection (NOT HOVER)
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const getRelativePointer = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    };

    // Pointer hover only checks if hovering to change cursor to pointer
    const handlePointerMove = (e: MouseEvent) => {
      getRelativePointer(e);
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(
        planetMeshes.map((p) => p.mesh),
        false,
      );

      if (hits.length > 0) {
        container.style.cursor = "pointer";
      } else {
        container.style.cursor = "default";
      }
    };

    // Pointer click opens the Agent Work Dossier
    const handlePointerDown = (e: MouseEvent) => {
      getRelativePointer(e);
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(
        planetMeshes.map((p) => p.mesh),
        false,
      );

      if (hits.length > 0) {
        const key = hits[0].object.userData.agentKey as AgentKey;
        if (key && AGENT_PLANETS[key]) {
          setSelectedAgent(AGENT_PLANETS[key]);
        }
      }
    };

    renderer.domElement.addEventListener("mousemove", handlePointerMove);
    renderer.domElement.addEventListener("pointerdown", handlePointerDown);

    // 6. Smooth Parallax & Orbit Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    let mouseParallaxX = 0;
    let mouseParallaxY = 0;
    const handleWindowMouseMove = (e: MouseEvent) => {
      mouseParallaxX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseParallaxY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", handleWindowMouseMove);

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Smooth camera subtle sway based on mouse
      const targetCamX = mouseParallaxX * 2.5;
      const targetCamY = 11 - mouseParallaxY * 1.5;
      camera.position.x += (targetCamX - camera.position.x) * 0.03;
      camera.position.y += (targetCamY - camera.position.y) * 0.03;
      camera.lookAt(0, 0, 0);

      // Rotate Sun Core
      sunGroup.rotation.y += delta * 0.15;
      coronaMesh.rotation.z += delta * 0.08;
      flareMesh.rotation.z -= delta * 0.12;

      // Pulse sun light gently
      const pulse = 4.2 + Math.sin(elapsed * 2.5) * 0.3;
      sunLight.intensity = pulse;

      // Animate Planets independently along their asynchronous orbits
      planetMeshes.forEach((item) => {
        // Increment angle by its unique orbital velocity
        item.currentAngle += delta * item.info.orbitSpeed * 0.35;

        // Position along elliptical inclined orbit
        const x = Math.cos(item.currentAngle) * item.info.orbitRadius;
        const z = Math.sin(item.currentAngle) * item.info.orbitRadius;
        const y = Math.sin(item.currentAngle) * Math.sin(item.info.inclination) * 1.8;

        item.group.position.set(x, y, z);

        // Axial self-rotation of the planet
        item.mesh.rotation.y += delta * 0.8;

        // Orbiting moon if present
        if (item.moon) {
          const moonAngle = elapsed * 2.0;
          const mx = Math.cos(moonAngle) * (item.info.planetRadius * 1.7);
          const mz = Math.sin(moonAngle) * (item.info.planetRadius * 1.7);
          item.moon.position.set(mx, 0, mz);
          item.moon.rotation.y += delta;
        }
      });

      // Slowly rotate celestial starfield
      starField.rotation.y = elapsed * 0.008;

      renderer.render(scene, camera);
    };

    animate();

    // 7. Responsive Resizer
    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth || window.innerWidth;
      height = container.clientHeight || window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener("resize", handleResize);

    // 8. Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleWindowMouseMove);
      renderer.domElement.removeEventListener("mousemove", handlePointerMove);
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);

      sunGeo.dispose();
      sunMat.dispose();
      coronaGeo.dispose();
      coronaMat.dispose();
      flareGeo.dispose();
      flareMat.dispose();
      starGeo.dispose();
      starMat.dispose();

      planetMeshes.forEach((item) => {
        item.mesh.geometry.dispose();
        if (Array.isArray(item.mesh.material)) {
          item.mesh.material.forEach((m) => m.dispose());
        } else {
          item.mesh.material.dispose();
        }
        if (item.moon) {
          item.moon.geometry.dispose();
          if (Array.isArray(item.moon.material)) {
            item.moon.material.forEach((m) => m.dispose());
          } else {
            item.moon.material.dispose();
          }
        }
      });

      renderer.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <section className="relative h-screen w-full select-none overflow-hidden bg-[#090a0d]">
      {/* 3D WebGL Canvas (Covers entire screen) */}
      <div
        ref={containerRef}
        className="absolute inset-0 h-full w-full"
        role="img"
        aria-label="3D Solar System of CodeForge AI Agents"
      >
        {!isSupported && (
          <div className="flex h-full w-full items-center justify-center p-6 text-center text-sm text-neutral-500">
            3D WebGL preview not available in this environment.
          </div>
        )}
      </div>

      {/* Top Floating Glass Header Overlay */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between px-6 py-6 lg:px-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="font-mono text-xs uppercase tracking-widest text-neutral-400">
              Solar Agent Architecture
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Autonomous Multi-Agent System
          </h1>
          <p className="mt-1 max-w-lg text-xs leading-relaxed text-neutral-400">
            The central state machine acts as the solar core. Specialized agents orbit as independent planetary nodes. Click any planet to inspect its full responsibilities and deliverables.
          </p>
        </div>

        {/* Explore Button */}
        {onExploreWorkspace && (
          <button
            type="button"
            onClick={onExploreWorkspace}
            className="pointer-events-auto hidden items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-2 text-xs font-medium text-white backdrop-blur-xl transition hover:border-white/30 hover:bg-white/[0.08] sm:inline-flex"
          >
            Go to Projects Workspace ↓
          </button>
        )}
      </div>

      {/* Bottom Floating Glass Agent Legend / Direct Click Bar */}
      <div className="pointer-events-auto absolute bottom-8 left-6 right-6 z-20 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/[0.08] bg-[#121318]/60 p-4 backdrop-blur-2xl shadow-2xl lg:left-10 lg:right-10">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-2 font-mono text-xs text-neutral-500">CLICK TO INSPECT:</span>
          {Object.values(AGENT_PLANETS).map((planet) => (
            <button
              key={planet.key}
              type="button"
              onClick={() => setSelectedAgent(planet)}
              className="group flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-xs text-neutral-300 transition-all hover:border-white/30 hover:bg-white/[0.08] hover:text-white"
            >
              <span
                className="h-2 w-2 rounded-full transition-transform group-hover:scale-125"
                style={{ backgroundColor: planet.baseColor }}
              />
              <span className="font-medium">{planet.name}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-neutral-400">
            Orbiting Asynchronously
          </span>
          {onExploreWorkspace && (
            <button
              type="button"
              onClick={onExploreWorkspace}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white px-3 py-1 text-xs font-medium text-black transition hover:bg-neutral-200"
            >
              Open Workspace
            </button>
          )}
        </div>
      </div>

      {/* Interactive Agent Work Modal (Opens when planet is CLICKED, not on hover) */}
      {selectedAgent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="agent-modal-title"
        >
          <div className="relative w-full max-w-2xl rounded-2xl border border-white/[0.12] bg-[#101116]/95 p-6 shadow-2xl backdrop-blur-2xl sm:p-8">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: selectedAgent.baseColor }}
                  />
                  <span className="font-mono text-xs tracking-wider text-neutral-400">
                    {selectedAgent.callsign}
                  </span>
                </div>
                <h2
                  id="agent-modal-title"
                  className="mt-2 text-2xl font-bold tracking-tight text-white"
                >
                  {selectedAgent.name}
                </h2>
                <p className="mt-1 text-xs text-neutral-400 font-mono">
                  {selectedAgent.role}
                </p>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedAgent(null)}
                className="rounded-lg border border-white/[0.08] bg-white/[0.04] p-2 text-neutral-400 transition hover:bg-white/[0.1] hover:text-white"
                aria-label="Close Agent Dossier"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="mt-6 space-y-5 text-sm">
              <p className="text-neutral-300 leading-relaxed font-normal">
                {selectedAgent.tagline}
              </p>

              {/* Responsibilities */}
              <div>
                <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                  Core Responsibilities
                </h3>
                <ul className="mt-2 space-y-1.5 text-xs text-neutral-300">
                  {selectedAgent.responsibilities.map((resp, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-neutral-500 font-mono">0{i + 1}.</span>
                      <span>{resp}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Inputs & Outputs Grid */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
                  <span className="block font-mono text-[11px] uppercase tracking-wider text-neutral-400">
                    Inputs Consumed
                  </span>
                  <ul className="mt-2 space-y-1 text-xs text-neutral-300">
                    {selectedAgent.inputs.map((inp, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <span className="h-1 w-1 rounded-full bg-blue-400" />
                        <span>{inp}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
                  <span className="block font-mono text-[11px] uppercase tracking-wider text-neutral-400">
                    Deliverables & Artifacts
                  </span>
                  <ul className="mt-2 space-y-1 text-xs text-neutral-300">
                    {selectedAgent.outputs.map((out, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <span className="h-1 w-1 rounded-full bg-emerald-400" />
                        <span>{out}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* LangGraph Role */}
              <div className="rounded-xl border border-white/[0.06] bg-black/40 p-3 text-xs text-neutral-400">
                <span className="font-mono text-white font-semibold">LangGraph State: </span>
                {selectedAgent.langgraphRole}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-6 flex items-center justify-end gap-3 border-t border-white/[0.08] pt-4">
              <button
                type="button"
                onClick={() => setSelectedAgent(null)}
                className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-xs font-medium text-neutral-300 transition hover:bg-white/[0.08] hover:text-white"
              >
                Close
              </button>
              {onExploreWorkspace && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAgent(null);
                    onExploreWorkspace();
                  }}
                  className="rounded-xl bg-white px-4 py-2 text-xs font-semibold text-black transition hover:bg-neutral-200"
                >
                  Create Project in Workspace →
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
