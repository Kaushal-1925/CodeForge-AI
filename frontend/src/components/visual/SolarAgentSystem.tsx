"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export type AgentKind = "LLM" | "Rule-based" | "File I/O" | "Subprocess" | "State Router";

export interface FullAgentInfo {
  key: string;
  name: string;
  shortName: string;
  kind: AgentKind;
  planetOrder: number;
  orbitRadius: number;
  orbitSpeed: number; // rad/s (asynchronous)
  radius: number; // planet scale
  baseColor: string;
  hexColor: number;
  hasRing?: boolean; // Only Developer has rings
  surfaceType: "crater" | "continents" | "bands" | "ice" | "metal";
  reportSummary: string;
  responsibilities: string[];
  inputs: string[];
  outputs: string[];
  rulesAndGuards: string[];
  langgraphNode: string;
}

// All 11 agents as independent circular planets orbiting the Sun
export const ALL_AGENTS: FullAgentInfo[] = [
  {
    key: "manager",
    name: "Manager Agent",
    shortName: "Manager",
    kind: "LLM",
    planetOrder: 1,
    orbitRadius: 4.2,
    orbitSpeed: 0.38,
    radius: 0.44,
    baseColor: "#eab308",
    hexColor: 0xeab308,
    surfaceType: "crater",
    reportSummary:
      "Turns the raw prompt into clean, numbered functional requirements. It is strictly forbidden from writing code.",
    responsibilities: [
      "Translates unstructured user prompts into discrete, numbered functional specifications.",
      "Extracts scope constraints, boundary conditions, and acceptance criteria.",
      "Ensures requirements strictly align with CodeForge's approved technology stack.",
      "Maintains clean separation between user intent and architectural execution.",
    ],
    inputs: ["Raw natural-language user request", "Project name and metadata"],
    outputs: ["Clean numbered functional requirements list (state['requirements'])"],
    rulesAndGuards: [
      "Strictly forbidden from writing implementation code.",
      "Must number every requirement explicitly for downstream verification.",
    ],
    langgraphNode: "First node in the LangGraph graph (START -> manager_agent).",
  },
  {
    key: "architect",
    name: "Architect Agent",
    shortName: "Architect",
    kind: "LLM",
    planetOrder: 2,
    orbitRadius: 6.0,
    orbitSpeed: 0.33,
    radius: 0.52,
    baseColor: "#38bdf8",
    hexColor: 0x38bdf8,
    surfaceType: "continents",
    reportSummary:
      "Produces a technical specification across six mandatory sections, restricted to the approved technology stack.",
    responsibilities: [
      "Designs software blueprints across 6 mandatory sections: Overview, Architecture, Tech Stack, API Contracts, Database Schema, and Testing Strategy.",
      "Defines SQLAlchemy model structures, database relations, and foreign keys.",
      "Specifies REST API endpoints, request/response models, and status codes.",
      "Receives rejection feedback from Architecture Validator and self-corrects design flaws.",
    ],
    inputs: ["state['requirements'] from Manager Agent", "Optional previous validation error feedback"],
    outputs: ["Full technical blueprint (state['architecture'])", "Data models and route contracts"],
    rulesAndGuards: [
      "Must include all six mandatory architectural sections.",
      "Restricted strictly to FastAPI, SQLAlchemy, PostgreSQL/SQLite, Next.js, and pytest.",
    ],
    langgraphNode: "manager_agent -> architect_agent.",
  },
  {
    key: "architecture_validator",
    name: "Architecture Validator",
    shortName: "Arch Validator",
    kind: "Rule-based",
    planetOrder: 3,
    orbitRadius: 7.8,
    orbitSpeed: 0.29,
    radius: 0.42,
    baseColor: "#0284c7",
    hexColor: 0x0284c7,
    surfaceType: "ice",
    reportSummary:
      "Rejects designs containing forbidden patterns. A retry router allows up to 3 attempts, after which the run is aborted.",
    responsibilities: [
      "Inspects the architecture blueprint using deterministic regex and pattern analysis.",
      "Detects forbidden frameworks, unapproved databases, or missing mandatory sections.",
      "Populates state['validation_errors'] with targeted guidance for the Architect.",
      "Routes flow to retry loop (up to 3 times) or signals run abortion.",
    ],
    inputs: ["state['architecture'] string"],
    outputs: ["List of validation error strings (state['validation_errors'])"],
    rulesAndGuards: [
      "Enforces a hard limit of 3 retry attempts before marking the run as failed.",
      "Zero LLM hallucination: 100% deterministic rule-based verification.",
    ],
    langgraphNode: "architect_agent -> architecture_validator -> architecture_retry_router.",
  },
  {
    key: "task_planner",
    name: "Task Planner",
    shortName: "Task Planner",
    kind: "LLM",
    planetOrder: 4,
    orbitRadius: 9.6,
    orbitSpeed: 0.25,
    radius: 0.48,
    baseColor: "#10b981",
    hexColor: 0x10b981,
    surfaceType: "continents",
    reportSummary:
      "Converts the architecture into an ordered task list as strict JSON, checked against a schema.",
    responsibilities: [
      "Deconstructs validated architecture into atomic, sequential engineering tasks.",
      "Orders tasks logically: Database -> Core Models -> Business Services -> API Routes -> Configuration.",
      "Ensures each task operates on discrete file boundaries to prevent merge collisions.",
      "Outputs strict JSON adhering to the Pydantic task planning schema.",
    ],
    inputs: ["Validated state['architecture'] blueprint"],
    outputs: ["Ordered JSON array of engineering tasks (state['tasks'])"],
    rulesAndGuards: [
      "Must output strict JSON only, parsed directly into Pydantic models.",
      "Every task must contain a clear title, description, and target files list.",
    ],
    langgraphNode: "architecture_validator (passed) -> task_planner.",
  },
  {
    key: "task_validator",
    name: "Task Validator",
    shortName: "Task Validator",
    kind: "Rule-based",
    planetOrder: 5,
    orbitRadius: 11.4,
    orbitSpeed: 0.22,
    radius: 0.42,
    baseColor: "#059669",
    hexColor: 0x059669,
    surfaceType: "metal",
    reportSummary:
      "Confirms the plan is non-empty and every task has a title and description.",
    responsibilities: [
      "Verifies the task list contains at least one actionable implementation task.",
      "Checks that every task has non-empty titles, valid descriptions, and valid file targets.",
      "Ensures dependency sequence integrity before code generation begins.",
      "Guarantees the workflow never enters the developer loop with a hollow plan.",
    ],
    inputs: ["state['tasks'] list"],
    outputs: ["Validation status verdict (task_validation_passed / failed)"],
    rulesAndGuards: [
      "Rejects any empty or malformed task specifications immediately.",
      "100% deterministic rule-based verification.",
    ],
    langgraphNode: "task_planner -> task_validator -> developer_agent.",
  },
  {
    key: "developer",
    name: "Developer Agent",
    shortName: "Developer",
    kind: "LLM",
    planetOrder: 6,
    orbitRadius: 13.4,
    orbitSpeed: 0.19,
    radius: 0.62, // The grand Jovian planet (only one with Saturn-like rings)
    baseColor: "#a855f7",
    hexColor: 0xa855f7,
    hasRing: true,
    surfaceType: "bands",
    reportSummary:
      "Generates code for one task at a time, reading existing workspace files, in a strict FILE...END_FILE format.",
    responsibilities: [
      "Executes the active task indicated by state['current_task_index'].",
      "Reads all previously generated files in the workspace to maintain import and interface consistency.",
      "Generates production code enclosed in strict `FILE: path` and `END_FILE` delimiter blocks.",
      "Implements business logic, typing, error handling, and framework integration.",
    ],
    inputs: ["state['current_task']", "state['architecture']", "All current files in workspace"],
    outputs: ["Raw source code blocks with FILE/END_FILE delimiters"],
    rulesAndGuards: [
      "Must generate complete file contents, never partial placeholders or comments like 'TODO'.",
      "Operates incrementally, completing one task before advancing to the next.",
    ],
    langgraphNode: "task_validator -> developer_agent -> validator_agent.",
  },
  {
    key: "code_validator",
    name: "Code Validator",
    shortName: "Code Validator",
    kind: "Rule-based",
    planetOrder: 7,
    orbitRadius: 15.4,
    orbitSpeed: 0.16,
    radius: 0.44,
    baseColor: "#8b5cf6",
    hexColor: 0x8b5cf6,
    surfaceType: "metal",
    reportSummary:
      "Confirms that files were actually parsed from the developer output.",
    responsibilities: [
      "Parses the Developer Agent's raw LLM response using delimiter matchers.",
      "Validates that at least one file was extracted with a non-empty relative path.",
      "Checks for proper balanced `FILE:` and `END_FILE` tags.",
      "Rejects empty or broken code responses before disk writing.",
    ],
    inputs: ["Raw LLM response string from Developer Agent"],
    outputs: ["Parsed dictionary of file paths to content (state['files'])"],
    rulesAndGuards: [
      "Raises validation error if zero files could be parsed.",
      "Guarantees only clean structured file dictionaries reach the filesystem.",
    ],
    langgraphNode: "developer_agent -> validator_agent -> artifact_writer.",
  },
  {
    key: "artifact_writer",
    name: "Artifact Writer",
    shortName: "Artifact Writer",
    kind: "File I/O",
    planetOrder: 8,
    orbitRadius: 17.4,
    orbitSpeed: 0.14,
    radius: 0.46,
    baseColor: "#c084fc",
    hexColor: 0xc084fc,
    surfaceType: "ice",
    reportSummary:
      "Copies a base template and writes generated files to disk with path-traversal protection.",
    responsibilities: [
      "Seeds the run workspace with clean starter templates.",
      "Writes each generated file from state['files'] to disk under `backend/var/workspaces/<run-id>/`.",
      "Enforces strict path-traversal protection (`../` prevention) to safeguard host filesystem.",
      "Creates required parent directories automatically.",
    ],
    inputs: ["state['files'] dictionary", "Target run workspace path"],
    outputs: ["Physical files and directories written to workspace disk"],
    rulesAndGuards: [
      "Rejects any file path escaping the sandbox workspace directory.",
      "Atomic disk writes with UTF-8 encoding.",
    ],
    langgraphNode: "validator_agent -> artifact_writer -> artifact_validator.",
  },
  {
    key: "artifact_validator",
    name: "Artifact Validator",
    shortName: "Artifact Validator",
    kind: "Rule-based",
    planetOrder: 9,
    orbitRadius: 19.4,
    orbitSpeed: 0.12,
    radius: 0.42,
    baseColor: "#94a3b8",
    hexColor: 0x94a3b8,
    surfaceType: "metal",
    reportSummary:
      "Checks that every written file exists and is not empty.",
    responsibilities: [
      "Scans the physical workspace directory on disk after Artifact Writer finishes.",
      "Confirms every declared file path physically exists.",
      "Verifies that file sizes exceed zero bytes.",
      "Ensures no disk write corruption occurred before testing starts.",
    ],
    inputs: ["Physical workspace directory on disk"],
    outputs: ["Artifact validation status (verified / missing_files)"],
    rulesAndGuards: [
      "Zero tolerance for zero-byte empty files.",
      "100% deterministic filesystem check.",
    ],
    langgraphNode: "artifact_writer -> artifact_validator -> tester_agent.",
  },
  {
    key: "tester",
    name: "Tester Agent",
    shortName: "Tester",
    kind: "Subprocess",
    planetOrder: 10,
    orbitRadius: 21.6,
    orbitSpeed: 0.10,
    radius: 0.54,
    baseColor: "#f59e0b",
    hexColor: 0xf59e0b,
    surfaceType: "crater",
    reportSummary:
      "Runs pytest inside the Docker sandbox and categorises any failure.",
    responsibilities: [
      "Executes `pytest` suites inside an isolated runtime sandbox.",
      "Captures standard output, error streams, and assertion failure logs.",
      "Categorizes test failures: Syntax, Import, Assertion, or Timeout.",
      "Records granular test statistics into state['test_results'].",
    ],
    inputs: ["Written workspace containing application and test files"],
    outputs: ["Test results dictionary (passed, failed, logs, failure_category)"],
    rulesAndGuards: [
      "Runs isolated with subprocess timeout protection.",
      "Graceful fallback if Docker daemon is not active on host.",
    ],
    langgraphNode: "artifact_validator -> tester_agent -> task_progression.",
  },
  {
    key: "task_progression",
    name: "Task Progression",
    shortName: "Progression",
    kind: "State Router",
    planetOrder: 11,
    orbitRadius: 23.8,
    orbitSpeed: 0.08,
    radius: 0.44,
    baseColor: "#d97706",
    hexColor: 0xd97706,
    surfaceType: "bands",
    reportSummary:
      "Advances to the next task index or signals full run completion.",
    responsibilities: [
      "Evaluates whether all tasks in state['tasks'] have been completed.",
      "If more tasks remain, increments `current_task_index` and loops back to Developer Agent.",
      "If all tasks are finished and tests pass, marks workflow as `completed`.",
      "Unlocks the human-in-the-loop change approval gate.",
    ],
    inputs: ["state['current_task_index']", "state['tasks']", "state['test_results']"],
    outputs: ["Updated task pointer or END of LangGraph state machine"],
    rulesAndGuards: [
      "Enforces MAX_ITERATIONS safety limit to prevent infinite loops.",
      "Gates the final change approval UI.",
    ],
    langgraphNode: "tester_agent -> task_progression -> (developer_agent OR END).",
  },
];

// Helper: generate realistic procedural planet textures on canvas
function createProceduralPlanetTexture(
  colorHex: number,
  surfaceType: FullAgentInfo["surfaceType"],
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const baseCol = new THREE.Color(colorHex);
  const darkCol = baseCol.clone().multiplyScalar(0.45);
  const lightCol = baseCol.clone().lerp(new THREE.Color(0xffffff), 0.28);

  ctx.fillStyle = `#${baseCol.getHexString()}`;
  ctx.fillRect(0, 0, 512, 256);

  if (surfaceType === "bands") {
    // Atmospheric gas giant storm belts (Developer)
    for (let i = 0; i < 22; i++) {
      const y = Math.random() * 256;
      const h = Math.random() * 18 + 4;
      ctx.fillStyle = Math.random() > 0.5 ? `#${darkCol.getHexString()}` : `#${lightCol.getHexString()}`;
      ctx.globalAlpha = Math.random() * 0.4 + 0.15;
      ctx.fillRect(0, y, 512, h);
    }
  } else if (surfaceType === "continents") {
    // Oceanic world with organic continents
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 256;
      const r = Math.random() * 32 + 10;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = `#${lightCol.getHexString()}`;
      ctx.globalAlpha = Math.random() * 0.35 + 0.1;
      ctx.fill();
    }
  } else if (surfaceType === "ice") {
    // Crystalline fissures and striations
    for (let i = 0; i < 25; i++) {
      ctx.strokeStyle = `#${lightCol.getHexString()}`;
      ctx.lineWidth = Math.random() * 2 + 1;
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.moveTo(Math.random() * 512, Math.random() * 256);
      ctx.lineTo(Math.random() * 512, Math.random() * 256);
      ctx.stroke();
    }
  } else {
    // Cratered / mottled rocky surface
    for (let i = 0; i < 35; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 256;
      const r = Math.random() * 18 + 4;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = `#${darkCol.getHexString()}`;
      ctx.globalAlpha = Math.random() * 0.4 + 0.1;
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

interface SolarAgentSystemProps {
  onExploreWorkspace?: () => void;
}

export function SolarAgentSystem({ onExploreWorkspace }: SolarAgentSystemProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const labelsContainerRef = useRef<HTMLDivElement | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<FullAgentInfo | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    const labelsContainer = labelsContainerRef.current;
    if (!container || !labelsContainer) return;

    // WebGL support test
    const testCanvas = document.createElement("canvas");
    const gl =
      testCanvas.getContext("webgl") || testCanvas.getContext("experimental-webgl");
    if (!gl) {
      setIsSupported(false);
      return;
    }

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x090a0d, 0.012);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 400);
    camera.position.set(0, 24, 38);
    camera.lookAt(0, 0, 0);

    // 2. WebGL Renderer
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

    // 3. OrbitControls (Smooth Free Navigation)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 90;
    controls.minDistance = 8;
    controls.maxPolarAngle = Math.PI / 2 + 0.05; // Keep above celestial horizon

    // 4. Central Sun (The LangGraph Coordinator Core)
    const sunGroup = new THREE.Group();
    scene.add(sunGroup);

    // Photosphere Core
    const sunGeo = new THREE.SphereGeometry(2.0, 48, 48);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffedd5 });
    const sunMesh = new THREE.Mesh(sunGeo, sunMat);
    sunGroup.add(sunMesh);

    // Inner Glowing Corona
    const coronaGeo = new THREE.SphereGeometry(2.35, 32, 32);
    const coronaMat = new THREE.MeshBasicMaterial({
      color: 0xf97316,
      transparent: true,
      opacity: 0.35,
      side: THREE.BackSide,
    });
    const coronaMesh = new THREE.Mesh(coronaGeo, coronaMat);
    sunGroup.add(coronaMesh);

    // Outer Solar Flare Halo
    const flareGeo = new THREE.RingGeometry(2.2, 3.4, 64);
    const flareMat = new THREE.MeshBasicMaterial({
      color: 0xffedd5,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide,
    });
    const flareMesh = new THREE.Mesh(flareGeo, flareMat);
    flareMesh.rotation.x = Math.PI / 2;
    sunGroup.add(flareMesh);

    // Dynamic Lighting
    const sunPointLight = new THREE.PointLight(0xfff7ed, 5.5, 100, 0.65);
    sunPointLight.position.set(0, 0, 0);
    scene.add(sunPointLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.28);
    scene.add(ambientLight);

    // 5. Deep Space Background Stars (1,800 stars)
    const starCount = 1800;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 200;
      starPositions[i + 1] = (Math.random() - 0.5) * 120;
      starPositions[i + 2] = (Math.random() - 0.5) * 200;
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.05,
      transparent: true,
      opacity: 0.55,
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // 6. Spawn All 11 Agents on Independent Circular Orbits
    const createdTextures: THREE.CanvasTexture[] = [];
    const planetsList: Array<{
      info: FullAgentInfo;
      mesh: THREE.Mesh;
      group: THREE.Group;
      radius: number;
      orbitRadius: number;
      currentAngle: number;
    }> = [];

    ALL_AGENTS.forEach((agent) => {
      // Clean concentric circular orbit line
      const orbitCurve = new THREE.EllipseCurve(
        0,
        0,
        agent.orbitRadius,
        agent.orbitRadius,
        0,
        Math.PI * 2,
        false,
        0,
      );
      const pts = orbitCurve.getPoints(128);
      const orbitGeo = new THREE.BufferGeometry().setFromPoints(
        pts.map((p) => new THREE.Vector3(p.x, 0, p.y)),
      );
      const orbitMat = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.09,
      });
      const orbitLine = new THREE.LineLoop(orbitGeo, orbitMat);
      orbitLine.rotation.x = Math.PI / 2; // Flat circular plane
      scene.add(orbitLine);

      // Planet Group
      const group = new THREE.Group();
      scene.add(group);

      // Generate procedural surface texture
      const texture = createProceduralPlanetTexture(agent.hexColor, agent.surfaceType);
      createdTextures.push(texture);

      const mat = new THREE.MeshStandardMaterial({
        map: texture,
        color: agent.hexColor,
        roughness: 0.55,
        metalness: 0.45,
        emissive: agent.hexColor,
        emissiveIntensity: 0.2,
      });

      const geo = new THREE.SphereGeometry(agent.radius, 32, 32);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.userData = { agentKey: agent.key };
      group.add(mesh);

      // Only Developer Agent gets Saturn-like rings (as requested)
      if (agent.hasRing) {
        const ringGeo = new THREE.RingGeometry(agent.radius * 1.4, agent.radius * 2.3, 48);
        const ringMat = new THREE.MeshBasicMaterial({
          color: agent.hexColor,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.38,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2.3;
        mesh.add(ring);
      }

      // Stagger initial starting angles so planets don't bunch up
      const startAngle = (agent.planetOrder * Math.PI) / 1.7;

      planetsList.push({
        info: agent,
        mesh,
        group,
        radius: agent.radius,
        orbitRadius: agent.orbitRadius,
        currentAngle: startAngle,
      });
    });

    // 7. Click Detection via Raycaster (Distinguish Drag from Click)
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let downPos = { x: 0, y: 0, time: 0 };

    const handlePointerDown = (e: MouseEvent) => {
      downPos = { x: e.clientX, y: e.clientY, time: Date.now() };
    };

    const handlePointerUp = (e: MouseEvent) => {
      const dist = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y);
      const elapsed = Date.now() - downPos.time;

      // If user dragged to rotate camera, ignore click
      if (dist > 6 || elapsed > 350) return;

      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(
        planetsList.map((p) => p.mesh),
        false,
      );

      if (hits.length > 0) {
        const key = hits[0].object.userData.agentKey;
        const target = ALL_AGENTS.find((a) => a.key === key);
        if (target) {
          setSelectedAgent(target);
        }
      }
    };

    renderer.domElement.addEventListener("pointerdown", handlePointerDown);
    renderer.domElement.addEventListener("pointerup", handlePointerUp);

    // 8. Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();
    const tempVec = new THREE.Vector3();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      controls.update();

      // Rotate Sun Core
      sunGroup.rotation.y += delta * 0.12;
      coronaMesh.rotation.z += delta * 0.05;
      flareMesh.rotation.z -= delta * 0.08;

      // Orbit all 11 planets CIRCULARLY on their OWN orbits around the Sun
      planetsList.forEach((p) => {
        // Increment angle by unique asynchronous orbital speed
        p.currentAngle += delta * p.info.orbitSpeed * 0.35;

        // Pure circular motion: x = cos(angle)*R, z = sin(angle)*R
        const x = Math.cos(p.currentAngle) * p.orbitRadius;
        const z = Math.sin(p.currentAngle) * p.orbitRadius;
        const y = 0; // Pure clean coplanar orbit

        p.group.position.set(x, y, z);

        // Axial self-rotation of the planet
        p.mesh.rotation.y += delta * 0.9;
      });

      // Update 2D Floating Name Labels (Direct DOM style translation, no React re-render)
      planetsList.forEach((p) => {
        const labelEl = document.getElementById(`label-${p.info.key}`);
        if (!labelEl) return;

        p.mesh.getWorldPosition(tempVec);
        tempVec.y -= p.radius * 1.45; // Position clearly beneath the planet
        tempVec.project(camera);

        const inFront = tempVec.z < 1.0;
        const screenX = (tempVec.x * 0.5 + 0.5) * width;
        const screenY = (-tempVec.y * 0.5 + 0.5) * height;

        if (inFront && screenX > -80 && screenX < width + 80 && screenY > -50 && screenY < height + 50) {
          labelEl.style.transform = `translate3d(${screenX}px, ${screenY}px, 0)`;
          labelEl.style.opacity = "1";
          labelEl.style.display = "block";
        } else {
          labelEl.style.opacity = "0";
          labelEl.style.display = "none";
        }
      });

      // Slowly rotate starfield
      stars.rotation.y = elapsed * 0.004;

      renderer.render(scene, camera);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth || window.innerWidth;
      height = container.clientHeight || window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      renderer.domElement.removeEventListener("pointerup", handlePointerUp);
      controls.dispose();

      sunGeo.dispose();
      sunMat.dispose();
      coronaGeo.dispose();
      coronaMat.dispose();
      flareGeo.dispose();
      flareMat.dispose();
      starGeo.dispose();
      starMat.dispose();
      createdTextures.forEach((t) => t.dispose());

      planetsList.forEach((p) => {
        p.mesh.geometry.dispose();
        if (Array.isArray(p.mesh.material)) {
          p.mesh.material.forEach((m) => m.dispose());
        } else {
          p.mesh.material.dispose();
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
      {/* 3D WebGL Canvas */}
      <div
        ref={containerRef}
        className="absolute inset-0 h-full w-full cursor-grab active:cursor-grabbing"
        role="img"
        aria-label="3D Solar System of all 11 CodeForge AI Agents"
      >
        {!isSupported && (
          <div className="flex h-full w-full items-center justify-center p-6 text-center text-sm text-neutral-500">
            3D WebGL preview not available in this environment.
          </div>
        )}
      </div>

      {/* Floating 2D Screen Space Labels Container */}
      <div
        ref={labelsContainerRef}
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        {ALL_AGENTS.map((agent) => (
          <div
            key={agent.key}
            id={`label-${agent.key}`}
            className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 will-change-transform"
            style={{ display: "none", opacity: 0 }}
          >
            <div className="flex flex-col items-center">
              <span
                className="whitespace-nowrap rounded-md border border-white/[0.1] bg-[#0c0d12]/85 px-2 py-0.5 font-mono text-[10px] font-medium tracking-wide text-neutral-200 shadow-lg backdrop-blur-md"
                style={{ borderLeftColor: agent.baseColor, borderLeftWidth: "2.5px" }}
              >
                {agent.shortName}
              </span>
              <span className="text-[8px] font-mono text-neutral-500 uppercase tracking-tight">
                {agent.kind}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Top Floating Glass Header Overlay */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between px-6 py-6 lg:px-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <span className="font-mono text-xs uppercase tracking-widest text-neutral-400">
              11 Autonomous Planetary Nodes
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Solar Multi-Agent System
          </h1>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-neutral-400">
            All 11 agents move circularly on their own independent orbits around the central state Sun. Drag to orbit the 3D camera. Scroll to zoom. Click any planet to open its full work dossier.
          </p>
        </div>

        {/* Scroll CTA Button */}
        {onExploreWorkspace && (
          <button
            type="button"
            onClick={onExploreWorkspace}
            className="pointer-events-auto hidden items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-2 text-xs font-medium text-white backdrop-blur-xl transition hover:border-white/30 hover:bg-white/[0.08] sm:inline-flex"
          >
            Open Projects Workspace ↓
          </button>
        )}
      </div>

      {/* Bottom Floating Glass Legend of All 11 Agents */}
      <div className="pointer-events-auto absolute bottom-6 left-6 right-6 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-[#121318]/70 p-3.5 backdrop-blur-2xl shadow-2xl lg:left-10 lg:right-10">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-2 font-mono text-[11px] text-neutral-500">
            CLICK TO INSPECT:
          </span>
          {ALL_AGENTS.map((agent) => (
            <button
              key={agent.key}
              type="button"
              onClick={() => setSelectedAgent(agent)}
              className="group flex items-center gap-1.5 rounded-lg border border-white/[0.05] bg-white/[0.02] px-2.5 py-1 text-xs text-neutral-300 transition-all hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
            >
              <span
                className="h-1.5 w-1.5 rounded-full transition-transform group-hover:scale-125"
                style={{ backgroundColor: agent.baseColor }}
              />
              <span className="font-medium text-[11px]">{agent.shortName}</span>
            </button>
          ))}
        </div>

        {onExploreWorkspace && (
          <button
            type="button"
            onClick={onExploreWorkspace}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white px-3 py-1.5 text-xs font-medium text-black transition hover:bg-neutral-200"
          >
            Launch Workspace
          </button>
        )}
      </div>

      {/* Interactive Agent Work Modal (Opens when planet is CLICKED, not on hover) */}
      {selectedAgent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="agent-modal-title"
        >
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/[0.12] bg-[#101116]/95 p-6 shadow-2xl backdrop-blur-2xl sm:p-8">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: selectedAgent.baseColor }}
                  />
                  <span className="font-mono text-xs tracking-wider text-neutral-400 uppercase">
                    Planet {selectedAgent.planetOrder} of 11
                  </span>
                  <span className="rounded bg-white/[0.08] px-2 py-0.5 font-mono text-[10px] text-white">
                    {selectedAgent.kind}
                  </span>
                </div>
                <h2
                  id="agent-modal-title"
                  className="mt-2 text-2xl font-bold tracking-tight text-white"
                >
                  {selectedAgent.name}
                </h2>
                <p className="mt-1 text-xs text-neutral-400 font-mono">
                  {selectedAgent.reportSummary}
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
              {/* Responsibilities */}
              <div>
                <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                  Execution Responsibilities
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

              {/* Rules and Guardrails */}
              <div>
                <h3 className="text-xs font-mono uppercase tracking-wider text-amber-400">
                  Rules &amp; Guardrails
                </h3>
                <ul className="mt-2 space-y-1.5 text-xs text-neutral-300">
                  {selectedAgent.rulesAndGuards.map((rule, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-amber-500 font-mono">!</span>
                      <span>{rule}</span>
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
                    Deliverables &amp; Artifacts
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

              {/* LangGraph State Machine Node */}
              <div className="rounded-xl border border-white/[0.06] bg-black/40 p-3 text-xs text-neutral-400">
                <span className="font-mono text-white font-semibold">LangGraph State: </span>
                {selectedAgent.langgraphNode}
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
