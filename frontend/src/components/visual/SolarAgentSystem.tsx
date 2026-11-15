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
  celestialRole: string;
  orbitRadius: number;
  orbitSpeed: number; // rad/s
  inclination: number; // radians
  radius: number;
  baseColor: string;
  hexColor: number;
  hasRing?: boolean;
  parentPlanetKey?: string; // If it's a moon/station orbiting a major planet
  moonOrbitRadius?: number;
  moonOrbitSpeed?: number;
  reportSummary: string;
  responsibilities: string[];
  inputs: string[];
  outputs: string[];
  rulesAndGuards: string[];
  langgraphNode: string;
}

export const ALL_AGENTS: FullAgentInfo[] = [
  {
    key: "manager",
    name: "Manager Agent",
    shortName: "Manager",
    kind: "LLM",
    celestialRole: "Planet I · Requirements Synthesis",
    orbitRadius: 4.0,
    orbitSpeed: 0.42,
    inclination: 0.1,
    radius: 0.36,
    baseColor: "#eab308",
    hexColor: 0xeab308,
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
    celestialRole: "Planet II · Technical Specification",
    orbitRadius: 6.2,
    orbitSpeed: 0.32,
    inclination: -0.14,
    radius: 0.42,
    baseColor: "#38bdf8",
    hexColor: 0x38bdf8,
    hasRing: true,
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
    celestialRole: "Moon of Architect · Pattern Defense",
    orbitRadius: 6.2, // Parent planet orbit
    orbitSpeed: 0.32,
    inclination: -0.14,
    radius: 0.22,
    baseColor: "#0284c7",
    hexColor: 0x0284c7,
    parentPlanetKey: "architect",
    moonOrbitRadius: 0.95,
    moonOrbitSpeed: 2.2,
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
    celestialRole: "Planet III · Task Decomposition",
    orbitRadius: 8.8,
    orbitSpeed: 0.24,
    inclination: 0.18,
    radius: 0.38,
    baseColor: "#10b981",
    hexColor: 0x10b981,
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
    celestialRole: "Moon of Task Planner · Plan Verification",
    orbitRadius: 8.8,
    orbitSpeed: 0.24,
    inclination: 0.18,
    radius: 0.2,
    baseColor: "#059669",
    hexColor: 0x059669,
    parentPlanetKey: "task_planner",
    moonOrbitRadius: 0.85,
    moonOrbitSpeed: 2.5,
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
    celestialRole: "Planet IV · Code Implementation (Jovian Giant)",
    orbitRadius: 11.6,
    orbitSpeed: 0.18,
    inclination: -0.22,
    radius: 0.54,
    baseColor: "#a855f7",
    hexColor: 0xa855f7,
    hasRing: true,
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
    celestialRole: "Inner Moon of Developer · Syntax & Parser Gate",
    orbitRadius: 11.6,
    orbitSpeed: 0.18,
    inclination: -0.22,
    radius: 0.22,
    baseColor: "#9333ea",
    hexColor: 0x9333ea,
    parentPlanetKey: "developer",
    moonOrbitRadius: 1.1,
    moonOrbitSpeed: 2.8,
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
    celestialRole: "Outer Moon of Developer · Safe Disk Persistence",
    orbitRadius: 11.6,
    orbitSpeed: 0.18,
    inclination: -0.22,
    radius: 0.24,
    baseColor: "#c084fc",
    hexColor: 0xc084fc,
    parentPlanetKey: "developer",
    moonOrbitRadius: 1.7,
    moonOrbitSpeed: 1.9,
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
    celestialRole: "Planet V · Disk Integrity Check",
    orbitRadius: 14.6,
    orbitSpeed: 0.13,
    inclination: 0.14,
    radius: 0.35,
    baseColor: "#94a3b8",
    hexColor: 0x94a3b8,
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
    celestialRole: "Planet VI · Automated Verification & Pytest",
    orbitRadius: 17.6,
    orbitSpeed: 0.09,
    inclination: -0.16,
    radius: 0.44,
    baseColor: "#f59e0b",
    hexColor: 0xf59e0b,
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
    celestialRole: "Orbital Gateway Station · State Loop & Completion",
    orbitRadius: 17.6,
    orbitSpeed: 0.09,
    inclination: -0.16,
    radius: 0.22,
    baseColor: "#d97706",
    hexColor: 0xd97706,
    parentPlanetKey: "tester",
    moonOrbitRadius: 1.1,
    moonOrbitSpeed: 2.4,
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

// Helper: generate procedural planet textures on canvas
function createProceduralPlanetTexture(colorHex: number, type: "bands" | "spots" | "crater"): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const baseCol = new THREE.Color(colorHex);
  const darkCol = baseCol.clone().multiplyScalar(0.5);
  const lightCol = baseCol.clone().lerp(new THREE.Color(0xffffff), 0.3);

  ctx.fillStyle = `#${baseCol.getHexString()}`;
  ctx.fillRect(0, 0, 512, 256);

  if (type === "bands") {
    // Gas giant horizontal atmospheric bands
    for (let i = 0; i < 20; i++) {
      const y = Math.random() * 256;
      const h = Math.random() * 16 + 4;
      ctx.fillStyle = Math.random() > 0.5 ? `#${darkCol.getHexString()}` : `#${lightCol.getHexString()}`;
      ctx.globalAlpha = Math.random() * 0.4 + 0.1;
      ctx.fillRect(0, y, 512, h);
    }
  } else {
    // Spots / craters / continent patches
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 256;
      const r = Math.random() * 28 + 6;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = Math.random() > 0.5 ? `#${darkCol.getHexString()}` : `#${lightCol.getHexString()}`;
      ctx.globalAlpha = Math.random() * 0.35 + 0.1;
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

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x090a0d, 0.016);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 300);
    camera.position.set(0, 16, 32);
    camera.lookAt(0, 0, 0);

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // 3. OrbitControls (Smooth free camera orbit & zoom)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 75;
    controls.minDistance = 6;
    controls.maxPolarAngle = Math.PI / 2 + 0.1; // Don't go deep below the plane
    controls.autoRotate = false;

    // 4. Solar Centerpiece: The State Engine Sun
    const sunGroup = new THREE.Group();
    scene.add(sunGroup);

    // Sun Photosphere Sphere
    const sunGeo = new THREE.SphereGeometry(1.8, 48, 48);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffedd5 });
    const sunMesh = new THREE.Mesh(sunGeo, sunMat);
    sunGroup.add(sunMesh);

    // Inner Corona Layer
    const coronaGeo = new THREE.SphereGeometry(2.1, 32, 32);
    const coronaMat = new THREE.MeshBasicMaterial({
      color: 0xfb923c,
      transparent: true,
      opacity: 0.38,
      side: THREE.BackSide,
    });
    const coronaMesh = new THREE.Mesh(coronaGeo, coronaMat);
    sunGroup.add(coronaMesh);

    // Solar Flares Disk
    const flareGeo = new THREE.RingGeometry(2.0, 3.2, 64);
    const flareMat = new THREE.MeshBasicMaterial({
      color: 0xffedd5,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
    });
    const flareMesh = new THREE.Mesh(flareGeo, flareMat);
    flareMesh.rotation.x = Math.PI / 2;
    sunGroup.add(flareMesh);

    // Sun PointLight (Casts lighting onto all planets)
    const sunPointLight = new THREE.PointLight(0xfff7ed, 5.0, 80, 0.7);
    sunPointLight.position.set(0, 0, 0);
    scene.add(sunPointLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.32);
    scene.add(ambientLight);

    // 5. Deep Space Starfield (1,600 stars)
    const starCount = 1600;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 160;
      starPositions[i + 1] = (Math.random() - 0.5) * 100;
      starPositions[i + 2] = (Math.random() - 0.5) * 160;
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.055,
      transparent: true,
      opacity: 0.6,
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // 6. Spawn all 11 Agents (Planets & Companions)
    const createdTextures: THREE.CanvasTexture[] = [];
    const celestialBodies: Array<{
      info: FullAgentInfo;
      mesh: THREE.Mesh;
      group: THREE.Group;
      radius: number;
      currentAngle: number;
      parentBody?: any;
    }> = [];

    // Map to find parents for moons
    const planetMap: Record<string, { group: THREE.Group }> = {};

    ALL_AGENTS.forEach((agent) => {
      const isMoon = Boolean(agent.parentPlanetKey);

      // Create group
      const group = new THREE.Group();

      // Create procedural texture
      const textureType = agent.hasRing ? "bands" : "spots";
      const texture = createProceduralPlanetTexture(agent.hexColor, textureType);
      createdTextures.push(texture);

      // Material
      const mat = new THREE.MeshStandardMaterial({
        map: texture,
        color: agent.hexColor,
        roughness: 0.5,
        metalness: 0.6,
        emissive: agent.hexColor,
        emissiveIntensity: isMoon ? 0.4 : 0.25,
      });

      const geo = new THREE.SphereGeometry(agent.radius, 32, 32);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.userData = { agentKey: agent.key };
      group.add(mesh);

      // Add planetary rings if applicable
      if (agent.hasRing) {
        const ringGeo = new THREE.RingGeometry(agent.radius * 1.4, agent.radius * 2.2, 32);
        const ringMat = new THREE.MeshBasicMaterial({
          color: agent.hexColor,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.35,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2.4;
        mesh.add(ring);
      }

      if (!isMoon) {
        // Orbit line
        const orbitCurve = new THREE.EllipseCurve(
          0,
          0,
          agent.orbitRadius,
          agent.orbitRadius,
          0,
          2 * Math.PI,
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
          opacity: 0.07,
        });
        const orbitLine = new THREE.LineLoop(orbitGeo, orbitMat);
        orbitLine.rotation.x = agent.inclination;
        scene.add(orbitLine);

        scene.add(group);
        planetMap[agent.key] = { group };
      } else {
        // Moons/stations are attached to their parent planet group
        const parent = planetMap[agent.parentPlanetKey!];
        if (parent) {
          parent.group.add(group);
        } else {
          scene.add(group);
        }
      }

      // Initial angle staggered for natural realism
      const startAngle = Math.random() * Math.PI * 2;

      celestialBodies.push({
        info: agent,
        mesh,
        group,
        radius: agent.radius,
        currentAngle: startAngle,
        parentBody: agent.parentPlanetKey ? planetMap[agent.parentPlanetKey] : null,
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
        celestialBodies.map((b) => b.mesh),
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

      // Rotate Sun Core and flares
      sunGroup.rotation.y += delta * 0.12;
      coronaMesh.rotation.z += delta * 0.05;
      flareMesh.rotation.z -= delta * 0.08;

      // Orbit all celestial bodies asynchronously
      celestialBodies.forEach((b) => {
        if (!b.info.parentPlanetKey) {
          // Major Planet
          b.currentAngle += delta * b.info.orbitSpeed * 0.45;
          const x = Math.cos(b.currentAngle) * b.info.orbitRadius;
          const z = Math.sin(b.currentAngle) * b.info.orbitRadius;
          const y = Math.sin(b.currentAngle) * Math.sin(b.info.inclination) * 2.2;
          b.group.position.set(x, y, z);
        } else {
          // Moon / Satellite
          const moonAngle = elapsed * (b.info.moonOrbitSpeed || 2.0) + b.currentAngle;
          const dist = b.info.moonOrbitRadius || 1.2;
          const mx = Math.cos(moonAngle) * dist;
          const mz = Math.sin(moonAngle) * dist;
          const my = Math.sin(moonAngle * 1.5) * 0.2;
          b.group.position.set(mx, my, mz);
        }

        // Axial self-rotation
        b.mesh.rotation.y += delta * 1.0;
      });

      // Update 2D Floating Name Labels (Direct DOM style translation, no React re-render)
      celestialBodies.forEach((b) => {
        const labelEl = document.getElementById(`label-${b.info.key}`);
        if (!labelEl) return;

        b.mesh.getWorldPosition(tempVec);
        tempVec.y -= b.radius * 1.4; // Position just below the planet
        tempVec.project(camera);

        const inFront = tempVec.z < 1.0;
        const screenX = (tempVec.x * 0.5 + 0.5) * width;
        const screenY = (-tempVec.y * 0.5 + 0.5) * height;

        if (inFront && screenX > -50 && screenX < width + 50 && screenY > -50 && screenY < height + 50) {
          labelEl.style.transform = `translate3d(${screenX}px, ${screenY}px, 0)`;
          labelEl.style.opacity = "1";
          labelEl.style.display = "block";
        } else {
          labelEl.style.opacity = "0";
          labelEl.style.display = "none";
        }
      });

      // Slowly rotate starfield
      stars.rotation.y = elapsed * 0.005;

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

      celestialBodies.forEach((b) => {
        b.mesh.geometry.dispose();
        if (Array.isArray(b.mesh.material)) {
          b.mesh.material.forEach((m) => m.dispose());
        } else {
          b.mesh.material.dispose();
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

      {/* Floating 2D Screen Space Labels Container (High performance, DOM-driven) */}
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
                className="whitespace-nowrap rounded-md border border-white/[0.1] bg-[#0c0d12]/80 px-2 py-0.5 font-mono text-[10px] font-medium tracking-wide text-neutral-200 shadow-md backdrop-blur-md"
                style={{ borderLeftColor: agent.baseColor, borderLeftWidth: "2px" }}
              >
                {agent.shortName}
              </span>
              <span className="text-[8px] font-mono text-neutral-500 uppercase tracking-tighter">
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
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="font-mono text-xs uppercase tracking-widest text-neutral-400">
              Complete 11-Node Architecture
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Solar Multi-Agent System
          </h1>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-neutral-400">
            Drag to orbit in 3D. Scroll to zoom. Click any planet or satellite to open its operational dossier and deliverable specs.
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
            AGENTS (CLICK TO INSPECT):
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
                    {selectedAgent.celestialRole}
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
