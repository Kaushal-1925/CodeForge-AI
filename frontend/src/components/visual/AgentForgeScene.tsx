"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export type AgentKey = "architect" | "tech_lead" | "developer" | "tester";

export interface AgentInfo {
  key: AgentKey;
  name: string;
  role: string;
  color: string;
  hex: number;
  description: string;
}

export const AGENT_REGISTRY: Record<AgentKey, AgentInfo> = {
  architect: {
    key: "architect",
    name: "Architect Agent",
    role: "System Architecture & Contracts",
    color: "#00e5ff",
    hex: 0x00e5ff,
    description: "Transforms user requests into architectural blueprints, data models, and API contracts.",
  },
  tech_lead: {
    key: "tech_lead",
    name: "Tech Lead Agent",
    role: "Task Decomposition & Strategy",
    color: "#10b981",
    hex: 0x10b981,
    description: "Deconstructs blueprints into ordered, atomic engineering tasks with clear acceptance criteria.",
  },
  developer: {
    key: "developer",
    name: "Developer Agent",
    role: "Code Implementation",
    color: "#a855f7",
    hex: 0xa855f7,
    description: "Executes engineering tasks, generates typed source files, module imports, and runtime configs.",
  },
  tester: {
    key: "tester",
    name: "Tester Agent",
    role: "Test Generation & Quality",
    color: "#f59e0b",
    hex: 0xf59e0b,
    description: "Builds comprehensive unit test suites, executes pytest runs in sandboxes, and validates fixes.",
  },
};

interface AgentForgeSceneProps {
  activeAgent?: AgentKey | null;
  onSelectAgent?: (agent: AgentKey) => void;
  className?: string;
}

export function AgentForgeScene({
  activeAgent,
  onSelectAgent,
  className = "",
}: AgentForgeSceneProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoveredAgent, setHoveredAgent] = useState<AgentKey | null>(null);
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

    const width = container.clientWidth || 480;
    const height = container.clientHeight || 360;

    // Scene & Camera
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x060913, 0.08);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.8, 6.5);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const coreLight = new THREE.PointLight(0x00e5ff, 2.5, 12);
    coreLight.position.set(0, 0, 0);
    scene.add(coreLight);

    // 1. Central "Forge Core"
    const coreGroup = new THREE.Group();
    scene.add(coreGroup);

    // Outer wireframe icosahedron
    const coreGeo = new THREE.IcosahedronGeometry(1.0, 1);
    const coreWireMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const coreWire = new THREE.Mesh(coreGeo, coreWireMat);
    coreGroup.add(coreWire);

    // Inner glowing sphere
    const innerGeo = new THREE.SphereGeometry(0.55, 16, 16);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x0ea5e9,
      wireframe: true,
      transparent: true,
      opacity: 0.6,
    });
    const innerCore = new THREE.Mesh(innerGeo, innerMat);
    coreGroup.add(innerCore);

    // 2. Orbital Rings
    const ringGeo1 = new THREE.RingGeometry(2.4, 2.43, 64);
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: 0x1e293b,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.4,
    });
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = Math.PI / 2.3;
    scene.add(ring1);

    const ringGeo2 = new THREE.RingGeometry(3.3, 3.33, 64);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0x334155,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.3,
    });
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.x = Math.PI / 1.7;
    ring2.rotation.y = Math.PI / 6;
    scene.add(ring2);

    // 3. Agent Satellite Nodes
    const agentKeys: AgentKey[] = ["architect", "tech_lead", "developer", "tester"];
    const agentMeshes: Array<{
      key: AgentKey;
      mesh: THREE.Mesh;
      glow: THREE.Mesh;
      baseRadius: number;
      speed: number;
      angle: number;
      yOffset: number;
    }> = [];

    const agentGroup = new THREE.Group();
    scene.add(agentGroup);

    agentKeys.forEach((key, index) => {
      const info = AGENT_REGISTRY[key];
      const radius = 2.4 + index * 0.35;
      const angle = (index / agentKeys.length) * Math.PI * 2;
      const yOffset = Math.sin(index * 1.5) * 0.4;

      // Node Geometry
      const nodeGeo = new THREE.OctahedronGeometry(0.24, 0);
      const nodeMat = new THREE.MeshStandardMaterial({
        color: info.hex,
        roughness: 0.2,
        metalness: 0.8,
        emissive: info.hex,
        emissiveIntensity: 0.5,
      });
      const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);
      nodeMesh.userData = { agentKey: key };

      // Outer Glow Halo
      const glowGeo = new THREE.SphereGeometry(0.36, 12, 12);
      const glowMat = new THREE.MeshBasicMaterial({
        color: info.hex,
        wireframe: true,
        transparent: true,
        opacity: 0.35,
      });
      const glowMesh = new THREE.Mesh(glowGeo, glowMat);
      nodeMesh.add(glowMesh);

      agentGroup.add(nodeMesh);

      agentMeshes.push({
        key,
        mesh: nodeMesh,
        glow: glowMesh,
        baseRadius: radius,
        speed: 0.4 + index * 0.1,
        angle,
        yOffset,
      });
    });

    // 4. Background Star / Particle Field
    const particleCount = 280;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 16;
      positions[i + 1] = (Math.random() - 0.5) * 12;
      positions[i + 2] = (Math.random() - 0.5) * 12;
    }
    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.035,
      transparent: true,
      opacity: 0.55,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Mouse / Pointer Parallax
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handlePointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    };

    container.addEventListener("mousemove", handlePointerMove);

    // Raycasting for interactive hover / click
    const raycaster = new THREE.Raycaster();
    const mouseVector = new THREE.Vector2();

    const handlePointerHover = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseVector.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseVector.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

      raycaster.setFromCamera(mouseVector, camera);
      const intersects = raycaster.intersectObjects(
        agentMeshes.map((a) => a.mesh),
        false,
      );

      if (intersects.length > 0) {
        const key = intersects[0].object.userData.agentKey as AgentKey;
        setHoveredAgent(key);
        container.style.cursor = "pointer";
      } else {
        setHoveredAgent(null);
        container.style.cursor = "default";
      }
    };

    const handleClick = () => {
      if (hoveredAgent && onSelectAgent) {
        onSelectAgent(hoveredAgent);
      }
    };

    container.addEventListener("mousemove", handlePointerHover);
    container.addEventListener("click", handleClick);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Smooth camera parallax
      targetX = mouseX * 0.8;
      targetY = mouseY * 0.5;
      camera.position.x += (targetX - camera.position.x) * 0.05;
      camera.position.y += (1.8 + targetY - camera.position.y) * 0.05;
      camera.lookAt(0, 0, 0);

      const motionSpeed = prefersReducedMotion ? 0.1 : 1.0;

      // Rotate forge core
      coreGroup.rotation.y += delta * 0.4 * motionSpeed;
      coreGroup.rotation.x = Math.sin(elapsed * 0.5) * 0.15;

      // Orbit agent satellite nodes
      agentMeshes.forEach((agent) => {
        agent.angle += delta * agent.speed * 0.5 * motionSpeed;
        const x = Math.cos(agent.angle) * agent.baseRadius;
        const z = Math.sin(agent.angle) * agent.baseRadius;
        const y = agent.yOffset + Math.sin(elapsed * 1.5 + agent.angle) * 0.15;

        agent.mesh.position.set(x, y, z);
        agent.mesh.rotation.y += delta * 1.5;
        agent.mesh.rotation.x += delta * 0.8;

        // Pulse scale if hovered or active
        const isTarget =
          hoveredAgent === agent.key || activeAgent === agent.key;
        const targetScale = isTarget ? 1.4 : 1.0;
        agent.mesh.scale.lerp(
          new THREE.Vector3(targetScale, targetScale, targetScale),
          0.1,
        );

        if (agent.glow.material instanceof THREE.MeshBasicMaterial) {
          agent.glow.material.opacity = isTarget ? 0.75 : 0.35;
        }
      });

      // Slowly rotate particle field
      particles.rotation.y = elapsed * 0.02 * motionSpeed;

      renderer.render(scene, camera);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      container.removeEventListener("mousemove", handlePointerMove);
      container.removeEventListener("mousemove", handlePointerHover);
      container.removeEventListener("click", handleClick);

      // Dispose Three resources
      coreGeo.dispose();
      coreWireMat.dispose();
      innerGeo.dispose();
      innerMat.dispose();
      ringGeo1.dispose();
      ringMat1.dispose();
      ringGeo2.dispose();
      ringMat2.dispose();
      particleGeo.dispose();
      particleMat.dispose();

      agentMeshes.forEach((a) => {
        a.mesh.geometry.dispose();
        if (Array.isArray(a.mesh.material)) {
          a.mesh.material.forEach((m) => m.dispose());
        } else {
          a.mesh.material.dispose();
        }
        a.glow.geometry.dispose();
        if (Array.isArray(a.glow.material)) {
          a.glow.material.forEach((m) => m.dispose());
        } else {
          a.glow.material.dispose();
        }
      });

      renderer.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [activeAgent, hoveredAgent, onSelectAgent]);

  const displayedAgentKey = hoveredAgent || activeAgent || "architect";
  const displayedInfo = AGENT_REGISTRY[displayedAgentKey];

  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-b from-surface/80 to-canvas/90 backdrop-blur-xl shadow-2xl ${className}`}
    >
      {/* 3D Canvas Container */}
      <div
        ref={containerRef}
        className="relative h-72 w-full select-none overflow-hidden sm:h-80 md:h-96"
        role="img"
        aria-label="Interactive 3D Multi-Agent Forge Topology"
      >
        {!isSupported && (
          <div className="flex h-full w-full items-center justify-center p-6 text-center text-sm text-muted">
            3D WebGL preview not available in this environment.
          </div>
        )}

        {/* Ambient Overlay Header */}
        <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs font-mono text-muted backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
          </span>
          LangGraph Agent Topology
        </div>

        {/* Interactive Tooltip in Canvas */}
        <div className="pointer-events-none absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-xl border border-white/10 bg-black/50 p-3.5 backdrop-blur-md">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: displayedInfo.color }}
              />
              <span className="text-sm font-semibold text-foreground">
                {displayedInfo.name}
              </span>
              <span className="text-xs font-mono text-muted">
                {displayedInfo.role}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted leading-relaxed">
              {displayedInfo.description}
            </p>
          </div>
          <span className="hidden text-xs font-mono text-accent sm:inline-block">
            Hover or click nodes
          </span>
        </div>
      </div>

      {/* Agent Selector Badges */}
      <div className="grid grid-cols-2 gap-2 border-t border-border/60 p-3 sm:grid-cols-4">
        {(Object.keys(AGENT_REGISTRY) as AgentKey[]).map((key) => {
          const info = AGENT_REGISTRY[key];
          const isCurrent = (hoveredAgent || activeAgent) === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectAgent && onSelectAgent(key)}
              onMouseEnter={() => setHoveredAgent(key)}
              onMouseLeave={() => setHoveredAgent(null)}
              className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 text-left text-xs transition-all ${
                isCurrent
                  ? "border-accent/60 bg-accent/10 text-foreground shadow-sm shadow-accent/20"
                  : "border-border/60 bg-surface/40 text-muted hover:border-border hover:text-foreground"
              }`}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: info.color }}
              />
              <span className="font-medium truncate">{info.name.replace(" Agent", "")}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
