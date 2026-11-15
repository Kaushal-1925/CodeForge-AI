"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import {
  createEarthTexture,
  createJupiterTexture,
  createMarsTexture,
  createMercuryTexture,
  createMoonTexture,
  createNeptuneTexture,
  createSaturnRingTexture,
  createSaturnTexture,
  createSunTexture,
  createUranusTexture,
  createVenusTexture,
} from "./solarTextures";

export type AgentKind = "LLM" | "Rule-based" | "File I/O" | "Subprocess" | "State Router";

export interface PlanetData {
  key: string;
  name: string;
  astronomicalName: string;
  agentRole: string;
  kind: AgentKind;
  order: number;
  actualDiameterKm: number;
  meanDistanceAU: number;
  displayRadius: number;
  displayOrbitRadius: number;
  orbitSpeed: number; // rad/s
  rotationPeriodHours: number;
  axialTiltDeg: number;
  hasRings?: boolean;
  hasMoon?: boolean;
  scientificDescription: string;
  agentReportSummary: string;
  responsibilities: string[];
  inputs: string[];
  outputs: string[];
  guardrails: string[];
  langgraphNode: string;
  colorHex: string;
}

export const PLANETS: PlanetData[] = [
  {
    key: "mercury",
    name: "Mercury",
    astronomicalName: "Planet I · Mercury",
    agentRole: "Manager Agent",
    kind: "LLM",
    order: 1,
    actualDiameterKm: 4879,
    meanDistanceAU: 0.39,
    displayRadius: 0.32,
    displayOrbitRadius: 6.8,
    orbitSpeed: 0.38,
    rotationPeriodHours: 1407.6,
    axialTiltDeg: 0.034,
    colorHex: "#9ca3af",
    scientificDescription:
      "Smallest planet in the solar system. Rocky, airless terrestrial world with ancient, heavily cratered charcoal-grey basalt terrain.",
    agentReportSummary:
      "Turns the raw prompt into clean, numbered functional requirements. Strictly forbidden from writing code.",
    responsibilities: [
      "Deconstructs raw user requests into numbered, testable functional specifications.",
      "Identifies edge constraints, operational boundaries, and acceptance criteria.",
      "Enforces technology stack boundaries before technical architecture begins.",
      "Maintains clean separation between product scope and code generation.",
    ],
    inputs: ["Raw natural-language prompt", "Project metadata"],
    outputs: ["state['requirements'] - Clean numbered requirements list"],
    guardrails: [
      "Strictly forbidden from writing implementation code.",
      "Must number every requirement explicitly for downstream traceability.",
    ],
    langgraphNode: "START -> manager_agent -> architect_agent",
  },
  {
    key: "venus",
    name: "Venus",
    astronomicalName: "Planet II · Venus",
    agentRole: "Architecture Validator",
    kind: "Rule-based",
    order: 2,
    actualDiameterKm: 12104,
    meanDistanceAU: 0.72,
    displayRadius: 0.48,
    displayOrbitRadius: 9.6,
    orbitSpeed: 0.31,
    rotationPeriodHours: -5832.5, // Retrograde rotation
    axialTiltDeg: 177.3,
    colorHex: "#fde68a",
    scientificDescription:
      "Terrestrial planet veiled beneath an impenetrable, dense carbon dioxide atmosphere with pale golden-yellow super-rotating sulfuric cloud bands.",
    agentReportSummary:
      "Rejects designs containing forbidden patterns. A retry router allows up to 3 attempts, after which the run is aborted.",
    responsibilities: [
      "Parses technical blueprints with deterministic pattern matchers.",
      "Detects unapproved external libraries, forbidden frameworks, and non-standard architectures.",
      "Populates state['validation_errors'] with exact guidance for architectural self-correction.",
      "Governs the retry loop router with a hard safety ceiling of 3 attempts.",
    ],
    inputs: ["state['architecture'] specification blueprint"],
    outputs: ["state['validation_errors'] list of pattern rejections"],
    guardrails: [
      "Hard maximum limit of 3 retry attempts before aborting.",
      "Zero LLM hallucination: 100% deterministic rule-based evaluation.",
    ],
    langgraphNode: "architect_agent -> architecture_validator -> architecture_retry_router",
  },
  {
    key: "earth",
    name: "Earth",
    astronomicalName: "Planet III · Earth",
    agentRole: "Architect Agent",
    kind: "LLM",
    order: 3,
    actualDiameterKm: 12742,
    meanDistanceAU: 1.0,
    displayRadius: 0.52,
    displayOrbitRadius: 12.8,
    orbitSpeed: 0.25,
    rotationPeriodHours: 23.93,
    axialTiltDeg: 23.44,
    hasMoon: true,
    colorHex: "#38bdf8",
    scientificDescription:
      "The dynamic blue planet. Deep oceans, recognizable green and brown continents, swirling cloud patterns, and a thin Rayleigh scattering atmospheric rim.",
    agentReportSummary:
      "Produces a technical specification across six mandatory sections, restricted to the approved technology stack.",
    responsibilities: [
      "Synthesizes blueprints across 6 mandatory sections: Overview, Architecture, Tech Stack, API Contracts, Database Schema, and Testing Strategy.",
      "Defines SQLAlchemy ORM models, relations, indices, and constraints.",
      "Designs REST API routes, request/response models, and status codes.",
      "Iterates autonomously when receiving error reports from the Architecture Validator.",
    ],
    inputs: ["state['requirements']", "Previous validation errors (if retrying)"],
    outputs: ["state['architecture'] - Full technical specification"],
    guardrails: [
      "Must include all six mandatory sections without exception.",
      "Restricted strictly to FastAPI, SQLAlchemy, PostgreSQL/SQLite, Next.js, and pytest.",
    ],
    langgraphNode: "manager_agent -> architect_agent -> architecture_validator",
  },
  {
    key: "mars",
    name: "Mars",
    astronomicalName: "Planet IV · Mars",
    agentRole: "Task Validator",
    kind: "Rule-based",
    order: 4,
    actualDiameterKm: 6779,
    meanDistanceAU: 1.52,
    displayRadius: 0.38,
    displayOrbitRadius: 16.5,
    orbitSpeed: 0.21,
    rotationPeriodHours: 24.62,
    axialTiltDeg: 25.19,
    colorHex: "#ea580c",
    scientificDescription:
      "Rugged rust-red world rich in iron oxide. Features dark basalt canyons (Valles Marineris), impact craters, and brilliant white carbon dioxide polar ice caps.",
    agentReportSummary:
      "Confirms the plan is non-empty and every task has a title, description, and target files.",
    responsibilities: [
      "Verifies that the task plan contains actionable implementation items.",
      "Validates that every task specifies concrete file boundaries to avoid merge collisions.",
      "Guarantees that task dependency order is valid and non-cyclic.",
      "Prevents the developer loop from starting on empty or malformed specifications.",
    ],
    inputs: ["state['tasks'] task list"],
    outputs: ["Task plan validation verdict (passed / failed)"],
    guardrails: [
      "Rejects any empty task list immediately.",
      "100% deterministic schema validation.",
    ],
    langgraphNode: "task_planner -> task_validator -> developer_agent",
  },
  {
    key: "jupiter",
    name: "Jupiter",
    astronomicalName: "Planet V · Jupiter",
    agentRole: "Task Planner",
    kind: "LLM",
    order: 5,
    actualDiameterKm: 139820,
    meanDistanceAU: 5.2,
    displayRadius: 1.45,
    displayOrbitRadius: 26.5,
    orbitSpeed: 0.14,
    rotationPeriodHours: 9.93,
    axialTiltDeg: 3.13,
    colorHex: "#b45309",
    scientificDescription:
      "The undisputed colossus of the solar system. Jovian gas giant with alternating cream, tan, and russet atmospheric bands, turbulent shear eddies, and the iconic Great Red Spot anticyclone.",
    agentReportSummary:
      "Converts the architecture into an ordered task list as strict JSON, checked against a schema.",
    responsibilities: [
      "Deconstructs architecture blueprints into atomic, sequential engineering tasks.",
      "Establishes optimal dependency DAG: Database -> Models -> Services -> API Routes -> Configuration.",
      "Outputs strict JSON adhering to CodeForge's Pydantic schema.",
      "Defines granular acceptance criteria for every individual task.",
    ],
    inputs: ["state['architecture'] validated blueprint"],
    outputs: ["state['tasks'] - Ordered array of implementation tasks"],
    guardrails: [
      "Must output strict JSON only, parsed directly into Pydantic models.",
      "Every task must target isolated, discrete file sets.",
    ],
    langgraphNode: "architecture_validator -> task_planner -> task_validator",
  },
  {
    key: "saturn",
    name: "Saturn",
    astronomicalName: "Planet VI · Saturn",
    agentRole: "Developer Agent",
    kind: "LLM",
    order: 6,
    actualDiameterKm: 116460,
    meanDistanceAU: 9.58,
    displayRadius: 1.2,
    displayOrbitRadius: 34.5,
    orbitSpeed: 0.1,
    rotationPeriodHours: 10.7,
    axialTiltDeg: 26.73,
    hasRings: true,
    colorHex: "#ca8a04",
    scientificDescription:
      "Magnificent ringed gas giant. Pale butterscotch atmosphere surrounded by an extensive 3D annular ring system with the dark Cassini Division separating the A and B rings.",
    agentReportSummary:
      "Generates code for one task at a time, reading existing workspace files, in a strict FILE...END_FILE format.",
    responsibilities: [
      "Executes the active task indicated by state['current_task_index'].",
      "Reads all existing workspace files to maintain import integrity and type consistency.",
      "Generates production code enclosed in strict `FILE: path` and `END_FILE` delimiter blocks.",
      "Implements business logic, typing, error handling, and framework integration.",
    ],
    inputs: ["state['current_task']", "state['architecture']", "Existing workspace file tree"],
    outputs: ["Raw source code blocks with FILE/END_FILE delimiters"],
    guardrails: [
      "Must generate complete file contents, never partial placeholders or comments like 'TODO'.",
      "Operates incrementally, completing one task before advancing to the next.",
    ],
    langgraphNode: "task_validator -> developer_agent -> validator_agent",
  },
  {
    key: "uranus",
    name: "Uranus",
    astronomicalName: "Planet VII · Uranus",
    agentRole: "Code Validator",
    kind: "Rule-based",
    order: 7,
    actualDiameterKm: 50724,
    meanDistanceAU: 19.2,
    displayRadius: 0.76,
    displayOrbitRadius: 42.5,
    orbitSpeed: 0.07,
    rotationPeriodHours: -17.24, // Retrograde
    axialTiltDeg: 97.77, // Extreme axial tilt (rotates on its side!)
    colorHex: "#22d3ee",
    scientificDescription:
      "Aquamarine ice giant spinning on its side with an extreme 98° axial tilt. Methane-rich upper atmosphere with faint vertical rings.",
    agentReportSummary:
      "Confirms that files were actually parsed from the developer output before disk writing.",
    responsibilities: [
      "Parses the Developer Agent's raw output using delimiter matchers.",
      "Validates that at least one file was extracted with a non-empty relative path.",
      "Checks for proper balanced `FILE:` and `END_FILE` tags.",
      "Rejects empty or broken code responses before disk writing.",
    ],
    inputs: ["Raw LLM response string from Developer Agent"],
    outputs: ["state['files'] - Parsed dictionary of file paths to content"],
    guardrails: [
      "Raises validation error if zero files could be parsed.",
      "Guarantees only clean structured file dictionaries reach the filesystem.",
    ],
    langgraphNode: "developer_agent -> validator_agent -> artifact_writer",
  },
  {
    key: "neptune",
    name: "Neptune",
    astronomicalName: "Planet VIII · Neptune",
    agentRole: "Tester Agent",
    kind: "Subprocess",
    order: 8,
    actualDiameterKm: 49244,
    meanDistanceAU: 30.05,
    displayRadius: 0.74,
    displayOrbitRadius: 50.5,
    orbitSpeed: 0.05,
    rotationPeriodHours: 16.11,
    axialTiltDeg: 28.32,
    colorHex: "#2563eb",
    scientificDescription:
      "Deep azure ice giant with high-velocity methane winds, delicate white cirrus cloud streaks, and atmospheric vortex storms (The Great Dark Spot).",
    agentReportSummary:
      "Runs pytest inside the isolated sandbox and categorises any failure.",
    responsibilities: [
      "Executes `pytest` suites inside an isolated runtime sandbox.",
      "Captures standard output, error streams, and assertion failure logs.",
      "Categorizes test failures: Syntax, Import, Assertion, or Timeout.",
      "Records granular test statistics into state['test_results'].",
    ],
    inputs: ["Written workspace containing application and test files"],
    outputs: ["state['test_results'] - Execution metrics, logs, and pass/fail verdicts"],
    guardrails: [
      "Runs isolated with subprocess timeout protection.",
      "Graceful fallback if Docker daemon is not active on host.",
    ],
    langgraphNode: "artifact_validator -> tester_agent -> task_progression",
  },
];

interface SolarAgentSystemProps {
  onExploreWorkspace?: () => void;
}

export function SolarAgentSystem({ onExploreWorkspace }: SolarAgentSystemProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const labelsContainerRef = useRef<HTMLDivElement | null>(null);
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetData | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [simulationSpeed, setSimulationSpeed] = useState(1.0);

  // Track selection and speed in refs so the WebGL scene never tears down on state changes
  const selectedPlanetRef = useRef<PlanetData | null>(null);
  const simulationSpeedRef = useRef<number>(1.0);
  const focusTargetRef = useRef<THREE.Vector3 | null>(null);

  useEffect(() => {
    selectedPlanetRef.current = selectedPlanet;
  }, [selectedPlanet]);

  useEffect(() => {
    simulationSpeedRef.current = simulationSpeed;
  }, [simulationSpeed]);

  useEffect(() => {
    const container = containerRef.current;
    const labelsContainer = labelsContainerRef.current;
    if (!container || !labelsContainer) return;

    // WebGL support test: check WebGL2, WebGL1, or experimental
    const testCanvas = document.createElement("canvas");
    const gl =
      testCanvas.getContext("webgl2") ||
      testCanvas.getContext("webgl") ||
      testCanvas.getContext("experimental-webgl");
    if (!gl) {
      setIsSupported(false);
      return;
    }

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    // 1. Scene & Perspective Camera
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x06080d, 0.008);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 800);
    camera.position.set(0, 36, 62);
    camera.lookAt(0, 0, 0);

    // 2. High-Performance WebGL Renderer (support default and fallback GPU adapters)
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: "default",
        preserveDrawingBuffer: true,
        failIfMajorPerformanceCaveat: false,
      });
    } catch (err) {
      console.warn("WebGL renderer creation failed:", err);
      setIsSupported(false);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x06080d, 1);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    container.appendChild(renderer.domElement);

    // 3. Smooth OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 140;
    controls.minDistance = 6;
    controls.maxPolarAngle = Math.PI / 2 + 0.04; // Don't flip under the solar plane

    // 4. Central Sun (Luminous Photosphere + Corona + Primary PointLight)
    const createdTextures: THREE.CanvasTexture[] = [];
    const sunGroup = new THREE.Group();
    scene.add(sunGroup);

    // Sun Photosphere Sphere with Convective Plasma Granulation Texture
    const sunTexture = createSunTexture();
    createdTextures.push(sunTexture);
    const sunGeo = new THREE.SphereGeometry(3.0, 64, 64);
    const sunMat = new THREE.MeshBasicMaterial({
      map: sunTexture,
      color: 0xffedd5,
    });
    const sunMesh = new THREE.Mesh(sunGeo, sunMat);
    sunGroup.add(sunMesh);

    // Subtle Reddish Chromosphere Edge Layer
    const chromoGeo = new THREE.SphereGeometry(3.12, 32, 32);
    const chromoMat = new THREE.MeshBasicMaterial({
      color: 0xf97316,
      transparent: true,
      opacity: 0.28,
      side: THREE.BackSide,
    });
    const chromoMesh = new THREE.Mesh(chromoGeo, chromoMat);
    sunGroup.add(chromoMesh);

    // Soft Volumetric Corona Layer (No rings on the Sun!)
    const coronaGeo = new THREE.SphereGeometry(3.45, 32, 32);
    const coronaMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0.18,
      side: THREE.BackSide,
    });
    const coronaMesh = new THREE.Mesh(coronaGeo, coronaMat);
    sunGroup.add(coronaMesh);

    // Primary Solar Light Source (Physically illuminates daytime side of planets)
    const sunPointLight = new THREE.PointLight(0xfff7ed, 6.5, 180, 0.55);
    sunPointLight.position.set(0, 0, 0);
    sunPointLight.castShadow = true;
    scene.add(sunPointLight);

    // Very subtle cosmic ambient fill so night sides are dark but visible
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.18);
    scene.add(ambientLight);

    // 5. Deep Space Background Starfield (2,400 Stars)
    const starCount = 2400;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 350;
      starPositions[i + 1] = (Math.random() - 0.5) * 200;
      starPositions[i + 2] = (Math.random() - 0.5) * 350;
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.05,
      transparent: true,
      opacity: 0.5,
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // 6. Main Asteroid Belt (Between Mars at 16.5 and Jupiter at 26.5)
    const asteroidCount = 420;
    const asteroidGeo = new THREE.DodecahedronGeometry(0.08, 0);
    const asteroidMat = new THREE.MeshStandardMaterial({
      color: 0x6b7280,
      roughness: 0.9,
      metalness: 0.1,
    });
    const asteroidInstanced = new THREE.InstancedMesh(asteroidGeo, asteroidMat, asteroidCount);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < asteroidCount; i++) {
      const dist = 20.5 + Math.random() * 4.0;
      const angle = Math.random() * Math.PI * 2;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const y = (Math.random() - 0.5) * 1.2;
      const scale = 0.5 + Math.random() * 1.2;

      dummy.position.set(x, y, z);
      dummy.scale.set(scale, scale, scale);
      dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      dummy.updateMatrix();
      asteroidInstanced.setMatrixAt(i, dummy.matrix);
    }
    scene.add(asteroidInstanced);

    // 7. Kuiper Belt (Faint icy debris field beyond Neptune > 50 AU)
    const kuiperCount = 380;
    const kuiperGeo = new THREE.BufferGeometry();
    const kuiperPositions = new Float32Array(kuiperCount * 3);
    for (let i = 0; i < kuiperCount * 3; i += 3) {
      const dist = 54.0 + Math.random() * 9.0;
      const angle = Math.random() * Math.PI * 2;
      kuiperPositions[i] = Math.cos(angle) * dist;
      kuiperPositions[i + 1] = (Math.random() - 0.5) * 2.2;
      kuiperPositions[i + 2] = Math.sin(angle) * dist;
    }
    kuiperGeo.setAttribute("position", new THREE.BufferAttribute(kuiperPositions, 3));
    const kuiperMat = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.04,
      transparent: true,
      opacity: 0.35,
    });
    const kuiperBelt = new THREE.Points(kuiperGeo, kuiperMat);
    scene.add(kuiperBelt);

    // 8. Spawn the 8 Real Planets on Circular Horizontal Orbits
    const planetsList: Array<{
      data: PlanetData;
      mesh: THREE.Mesh;
      group: THREE.Group;
      moonMesh?: THREE.Mesh;
      currentAngle: number;
    }> = [];

    PLANETS.forEach((planet) => {
      // Clean, flat horizontal circular orbit track (y = 0)
      const orbitCurve = new THREE.EllipseCurve(
        0,
        0,
        planet.displayOrbitRadius,
        planet.displayOrbitRadius,
        0,
        Math.PI * 2,
        false,
        0,
      );
      const pts = orbitCurve.getPoints(160);
      const orbitGeo = new THREE.BufferGeometry().setFromPoints(
        pts.map((p) => new THREE.Vector3(p.x, 0, p.y)),
      );
      const orbitMat = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.09,
      });
      const orbitLine = new THREE.LineLoop(orbitGeo, orbitMat);
      scene.add(orbitLine);

      // Planet Group
      const group = new THREE.Group();
      scene.add(group);

      // Select scientific texture based on planet identity
      let texture: THREE.CanvasTexture;
      switch (planet.key) {
        case "mercury":
          texture = createMercuryTexture();
          break;
        case "venus":
          texture = createVenusTexture();
          break;
        case "earth":
          texture = createEarthTexture();
          break;
        case "mars":
          texture = createMarsTexture();
          break;
        case "jupiter":
          texture = createJupiterTexture();
          break;
        case "saturn":
          texture = createSaturnTexture();
          break;
        case "uranus":
          texture = createUranusTexture();
          break;
        case "neptune":
          texture = createNeptuneTexture();
          break;
        default:
          texture = createMercuryTexture();
      }
      createdTextures.push(texture);

      const mat = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: planet.key === "earth" ? 0.45 : 0.7,
        metalness: 0.1,
      });

      const geo = new THREE.SphereGeometry(planet.displayRadius, 48, 48);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.userData = { planetKey: planet.key };
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      // Realistic Axial Tilt
      mesh.rotation.z = THREE.MathUtils.degToRad(planet.axialTiltDeg);
      group.add(mesh);

      // Earth's Atmosphere & Moon
      let moonMesh: THREE.Mesh | undefined;
      if (planet.hasMoon) {
        // Thin Rayleigh Scattering Rim
        const atmoGeo = new THREE.SphereGeometry(planet.displayRadius * 1.04, 32, 32);
        const atmoMat = new THREE.MeshBasicMaterial({
          color: 0x60a5fa,
          transparent: true,
          opacity: 0.22,
          side: THREE.BackSide,
        });
        const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
        mesh.add(atmoMesh);

        // Orbiting Moon
        const moonTexture = createMoonTexture();
        createdTextures.push(moonTexture);
        const moonGeo = new THREE.SphereGeometry(0.14, 24, 24);
        const moonMat = new THREE.MeshStandardMaterial({
          map: moonTexture,
          roughness: 0.85,
        });
        moonMesh = new THREE.Mesh(moonGeo, moonMat);
        group.add(moonMesh);
      }

      // Saturn's Realistic 3D Rings (Cassini Division, A, B, C rings)
      if (planet.hasRings) {
        const ringTexture = createSaturnRingTexture();
        createdTextures.push(ringTexture);
        const innerR = planet.displayRadius * 1.35;
        const outerR = planet.displayRadius * 2.55;
        const ringGeo = new THREE.RingGeometry(innerR, outerR, 64);

        // UV coordinate alignment for radial ring texture
        const pos = ringGeo.attributes.position;
        const uvs = [];
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i);
          const y = pos.getY(i);
          const len = Math.sqrt(x * x + y * y);
          const u = (len - innerR) / (outerR - innerR);
          uvs.push(u, 0.5);
        }
        ringGeo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));

        const ringMat = new THREE.MeshStandardMaterial({
          map: ringTexture,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.95,
          roughness: 0.6,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2 + THREE.MathUtils.degToRad(planet.axialTiltDeg);
        mesh.add(ring);
      }

      // Uranus faint, delicate vertical ring system (matching 98° axial tilt)
      if (planet.key === "uranus") {
        const uRingInner = planet.displayRadius * 1.35;
        const uRingOuter = planet.displayRadius * 1.58;
        const uRingGeo = new THREE.RingGeometry(uRingInner, uRingOuter, 64);
        const uRingMat = new THREE.MeshBasicMaterial({
          color: 0xa5f3fc,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.26,
        });
        const uRingMesh = new THREE.Mesh(uRingGeo, uRingMat);
        uRingMesh.rotation.x = Math.PI / 2;
        mesh.add(uRingMesh);
      }

      // Stagger starting orbital angle
      const startingAngle = (planet.order * Math.PI) / 1.6;

      planetsList.push({
        data: planet,
        mesh,
        group,
        moonMesh,
        currentAngle: startingAngle,
      });
    });

    // 9. Click Detection via Raycaster
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let downPos = { x: 0, y: 0, time: 0 };

    const handlePointerDown = (e: MouseEvent) => {
      downPos = { x: e.clientX, y: e.clientY, time: Date.now() };
    };

    const handlePointerUp = (e: MouseEvent) => {
      const dist = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y);
      const elapsed = Date.now() - downPos.time;

      // Distinguish drag from click
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
        const key = hits[0].object.userData.planetKey;
        const target = PLANETS.find((p) => p.key === key);
        if (target) {
          setSelectedPlanet(target);
          // Focus camera on target planet
          const hitPlanet = planetsList.find((p) => p.data.key === key);
          if (hitPlanet) {
            const worldPos = new THREE.Vector3();
            hitPlanet.mesh.getWorldPosition(worldPos);
            focusTargetRef.current = worldPos;
          }
        }
      }
    };

    renderer.domElement.addEventListener("pointerdown", handlePointerDown);
    renderer.domElement.addEventListener("pointerup", handlePointerUp);

    // 10. Animation Loop
    let animationFrameId: number;
    let lastTime = performance.now();
    const tempVec = new THREE.Vector3();

    // Initial synchronous render so canvas is never blank before first RAF
    renderer.render(scene, camera);

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const now = performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      const elapsed = now / 1000;
      lastTime = now;

      controls.update();

      // Smooth camera interpolation if focusing on a target
      if (focusTargetRef.current) {
        controls.target.lerp(focusTargetRef.current, 0.05);
      }

      // Rotate Sun & animate plasma surface activity
      sunGroup.rotation.y += delta * 0.08;
      coronaMesh.rotation.z += delta * 0.03;
      sunTexture.offset.x += delta * 0.006;

      // Rotate Asteroid Belt
      asteroidInstanced.rotation.y += delta * 0.015;

      // Animate All 8 Planets Circularly on Horizontal Orbits
      const currentSpeed = simulationSpeedRef.current;
      const currentSelected = selectedPlanetRef.current;

      planetsList.forEach((p) => {
        // Orbital revolution around the Sun (Horizontal XZ plane, y = 0)
        p.currentAngle += delta * p.data.orbitSpeed * 0.28 * currentSpeed;
        const x = Math.cos(p.currentAngle) * p.data.displayOrbitRadius;
        const z = Math.sin(p.currentAngle) * p.data.displayOrbitRadius;
        p.group.position.set(x, 0, z);

        // Planetary axial self-rotation (proportional to rotational period)
        const rotDir = p.data.rotationPeriodHours < 0 ? -1 : 1;
        p.mesh.rotation.y += delta * 0.8 * rotDir * currentSpeed;

        // Earth's Moon Orbit
        if (p.moonMesh) {
          const moonAngle = elapsed * 1.8 * currentSpeed;
          const mx = Math.cos(moonAngle) * 0.95;
          const mz = Math.sin(moonAngle) * 0.95;
          p.moonMesh.position.set(mx, 0, mz);
          p.moonMesh.rotation.y += delta;
        }

        // If this planet is currently focused by camera, update controls target
        if (currentSelected && currentSelected.key === p.data.key && focusTargetRef.current) {
          focusTargetRef.current.set(x, 0, z);
        }
      });

      // Update 2D Floating Name Labels (Direct DOM transform, 0 React re-renders)
      planetsList.forEach((p) => {
        const labelEl = document.getElementById(`label-${p.data.key}`);
        if (!labelEl) return;

        p.mesh.getWorldPosition(tempVec);
        tempVec.y -= p.data.displayRadius * 1.35; // Positioned cleanly below the planet
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

      // Subtle celestial star drift
      stars.rotation.y = elapsed * 0.003;

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
      chromoGeo.dispose();
      chromoMat.dispose();
      coronaGeo.dispose();
      coronaMat.dispose();
      starGeo.dispose();
      starMat.dispose();
      asteroidGeo.dispose();
      asteroidMat.dispose();
      kuiperGeo.dispose();
      kuiperMat.dispose();
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

  const handleResetCamera = () => {
    setSelectedPlanet(null);
    focusTargetRef.current = new THREE.Vector3(0, 0, 0);
  };

  const handleSelectPlanet = (planet: PlanetData) => {
    setSelectedPlanet(planet);
  };

  return (
    <section className="relative h-screen w-full select-none overflow-hidden bg-[#06080d]">
      {/* 3D WebGL Canvas */}
      <div
        ref={containerRef}
        className="absolute inset-0 h-full w-full cursor-grab active:cursor-grabbing"
        role="img"
        aria-label="Scientific 3D Solar System of CodeForge AI Agents"
      >
        {!isSupported && (
          <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center">
            <div className="max-w-md rounded-2xl border border-white/[0.1] bg-[#0d0f17]/90 p-8 backdrop-blur-2xl shadow-2xl">
              <span className="text-3xl">🪐</span>
              <h3 className="mt-3 text-lg font-semibold text-white">WebGL 3D Acceleration Required</h3>
              <p className="mt-2 text-xs leading-relaxed text-neutral-400">
                Your browser or system currently has hardware graphics acceleration disabled. To view the realistic 3D Solar System:
              </p>
              <div className="mt-4 rounded-xl border border-white/[0.08] bg-black/40 p-3 text-left font-mono text-[11px] text-neutral-300">
                1. Open <span className="text-amber-400">chrome://settings/system</span> or <span className="text-amber-400">edge://settings/system</span><br />
                2. Turn on <span className="text-white font-semibold">&quot;Use graphics acceleration when available&quot;</span><br />
                3. Relaunch your browser
              </div>
              {onExploreWorkspace && (
                <button
                  type="button"
                  onClick={onExploreWorkspace}
                  className="mt-5 w-full rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-black transition hover:bg-neutral-200"
                >
                  Continue to Projects Workspace ↓
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2D Floating Planet Screen Space Labels (Composited at 60 FPS) */}
      <div
        ref={labelsContainerRef}
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        {PLANETS.map((planet) => (
          <div
            key={planet.key}
            id={`label-${planet.key}`}
            className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 will-change-transform"
            style={{ display: "none", opacity: 0 }}
          >
            <div className="flex flex-col items-center">
              <span
                className="whitespace-nowrap rounded-md border border-white/[0.12] bg-[#0c0d12]/90 px-2 py-0.5 font-mono text-[10px] font-medium tracking-wide text-white shadow-xl backdrop-blur-md"
                style={{ borderLeftColor: planet.colorHex, borderLeftWidth: "2.5px" }}
              >
                {planet.name}
              </span>
              <span className="mt-0.5 text-[8px] font-mono text-neutral-400">
                {planet.agentRole}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Top Cockpit Header Overlay */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between px-6 py-6 lg:px-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="font-mono text-xs uppercase tracking-widest text-neutral-400">
              Astronomical Agent Architecture
            </span>
          </div>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            CodeForge AI Solar System
          </h1>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-neutral-400">
            The central intelligence is the Sun. Eight specialized agents orbit as planetary bodies from Mercury through Neptune. Click any planet to inspect its scientific and architectural dossier.
          </p>
        </div>

        {/* Right Navigation & Controls */}
        <div className="pointer-events-auto flex items-center gap-2.5">
          {selectedPlanet && (
            <button
              type="button"
              onClick={handleResetCamera}
              className="rounded-xl border border-white/[0.1] bg-white/[0.04] px-3.5 py-1.5 text-xs font-mono text-neutral-300 backdrop-blur-xl transition hover:bg-white/[0.08] hover:text-white"
            >
              Reset View ⟲
            </button>
          )}

          {/* Simulation Speed Toggle */}
          <div className="hidden items-center gap-1 rounded-xl border border-white/[0.1] bg-white/[0.04] p-1 text-xs font-mono backdrop-blur-xl sm:flex">
            <button
              type="button"
              onClick={() => setSimulationSpeed(0.5)}
              className={`rounded-lg px-2 py-1 transition ${
                simulationSpeed === 0.5 ? "bg-white text-black font-semibold" : "text-neutral-400 hover:text-white"
              }`}
            >
              0.5x
            </button>
            <button
              type="button"
              onClick={() => setSimulationSpeed(1.0)}
              className={`rounded-lg px-2 py-1 transition ${
                simulationSpeed === 1.0 ? "bg-white text-black font-semibold" : "text-neutral-400 hover:text-white"
              }`}
            >
              1.0x
            </button>
            <button
              type="button"
              onClick={() => setSimulationSpeed(2.0)}
              className={`rounded-lg px-2 py-1 transition ${
                simulationSpeed === 2.0 ? "bg-white text-black font-semibold" : "text-neutral-400 hover:text-white"
              }`}
            >
              2.0x
            </button>
          </div>

          {onExploreWorkspace && (
            <button
              type="button"
              onClick={onExploreWorkspace}
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white px-4 py-2 text-xs font-semibold text-black transition hover:bg-neutral-200"
            >
              Open Projects Workspace ↓
            </button>
          )}
        </div>
      </div>

      {/* Bottom Celestial Telemetry Bar */}
      <div className="pointer-events-auto absolute bottom-6 left-6 right-6 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-[#0c0d12]/80 p-3.5 backdrop-blur-2xl shadow-2xl lg:left-10 lg:right-10">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-2 font-mono text-[11px] text-neutral-400">
            CELESTIAL BODIES:
          </span>
          {PLANETS.map((planet) => (
            <button
              key={planet.key}
              type="button"
              onClick={() => handleSelectPlanet(planet)}
              className={`group flex items-center gap-2 rounded-lg border px-2.5 py-1 text-xs transition-all ${
                selectedPlanet?.key === planet.key
                  ? "border-white/40 bg-white/[0.12] text-white shadow-lg"
                  : "border-white/[0.06] bg-white/[0.02] text-neutral-300 hover:border-white/20 hover:text-white"
              }`}
            >
              <span
                className="h-2 w-2 rounded-full transition-transform group-hover:scale-125"
                style={{ backgroundColor: planet.colorHex }}
              />
              <span className="font-medium text-[11px]">{planet.name}</span>
              <span className="font-mono text-[9px] text-neutral-500">{planet.meanDistanceAU} AU</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-neutral-400">
          <span>Asteroid Belt: 1.8 AU</span>
          <span>·</span>
          <span>Kuiper Belt: 48 AU</span>
        </div>
      </div>

      {/* Astronomical & Agent Dossier Modal (Opens when planet is CLICKED, not on hover) */}
      {selectedPlanet && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="planet-modal-title"
        >
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/[0.14] bg-[#0d0f17]/95 p-6 shadow-2xl backdrop-blur-2xl sm:p-8">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: selectedPlanet.colorHex }}
                  />
                  <span className="font-mono text-xs uppercase tracking-widest text-neutral-400">
                    {selectedPlanet.astronomicalName}
                  </span>
                  <span className="rounded bg-white/[0.08] px-2 py-0.5 font-mono text-[10px] text-white">
                    {selectedPlanet.kind}
                  </span>
                </div>
                <h2
                  id="planet-modal-title"
                  className="mt-2 text-2xl font-bold tracking-tight text-white"
                >
                  {selectedPlanet.name} — {selectedPlanet.agentRole}
                </h2>
                <p className="mt-1 text-xs text-neutral-400 font-mono">
                  {selectedPlanet.agentReportSummary}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPlanet(null)}
                className="rounded-lg border border-white/[0.08] bg-white/[0.04] p-2 text-neutral-400 transition hover:bg-white/[0.1] hover:text-white"
                aria-label="Close Planet Dossier"
              >
                ✕
              </button>
            </div>

            {/* Astronomical Reference Grid */}
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-xl border border-white/[0.06] bg-black/40 p-3.5">
              <div>
                <span className="block font-mono text-[10px] uppercase tracking-wider text-neutral-500">
                  Mean Distance
                </span>
                <span className="mt-0.5 block font-mono text-sm font-semibold text-white">
                  {selectedPlanet.meanDistanceAU} AU
                </span>
              </div>
              <div>
                <span className="block font-mono text-[10px] uppercase tracking-wider text-neutral-500">
                  Diameter
                </span>
                <span className="mt-0.5 block font-mono text-sm font-semibold text-white">
                  {selectedPlanet.actualDiameterKm.toLocaleString()} km
                </span>
              </div>
              <div>
                <span className="block font-mono text-[10px] uppercase tracking-wider text-neutral-500">
                  Axial Tilt
                </span>
                <span className="mt-0.5 block font-mono text-sm font-semibold text-white">
                  {selectedPlanet.axialTiltDeg}°
                </span>
              </div>
              <div>
                <span className="block font-mono text-[10px] uppercase tracking-wider text-neutral-500">
                  Rotation Period
                </span>
                <span className="mt-0.5 block font-mono text-sm font-semibold text-white">
                  {Math.abs(selectedPlanet.rotationPeriodHours)} hrs
                </span>
              </div>
            </div>

            {/* Scientific Planet Characteristics */}
            <div className="mt-5">
              <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                Astronomical Description
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-neutral-300">
                {selectedPlanet.scientificDescription}
              </p>
            </div>

            {/* Agent Responsibilities */}
            <div className="mt-5">
              <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                Execution Responsibilities
              </h3>
              <ul className="mt-2 space-y-1.5 text-xs text-neutral-300">
                {selectedPlanet.responsibilities.map((resp, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-neutral-500 font-mono">0{i + 1}.</span>
                    <span>{resp}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Guardrails */}
            <div className="mt-5">
              <h3 className="text-xs font-mono uppercase tracking-wider text-amber-400">
                Strict Guardrails
              </h3>
              <ul className="mt-2 space-y-1.5 text-xs text-neutral-300">
                {selectedPlanet.guardrails.map((rule, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-amber-500 font-mono">!</span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Inputs & Outputs */}
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
                <span className="block font-mono text-[11px] uppercase tracking-wider text-neutral-400">
                  Inputs Consumed
                </span>
                <ul className="mt-2 space-y-1 text-xs text-neutral-300">
                  {selectedPlanet.inputs.map((inp, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <span className="h-1 w-1 rounded-full bg-blue-400" />
                      <span>{inp}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
                <span className="block font-mono text-[11px] uppercase tracking-wider text-neutral-400">
                  Deliverables Produced
                </span>
                <ul className="mt-2 space-y-1 text-xs text-neutral-300">
                  {selectedPlanet.outputs.map((out, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <span className="h-1 w-1 rounded-full bg-emerald-400" />
                      <span>{out}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* LangGraph Node State */}
            <div className="mt-5 rounded-xl border border-white/[0.06] bg-black/40 p-3 text-xs text-neutral-400">
              <span className="font-mono text-white font-semibold">LangGraph Pipeline: </span>
              {selectedPlanet.langgraphNode}
            </div>

            {/* Footer */}
            <div className="mt-6 flex items-center justify-end gap-3 border-t border-white/[0.08] pt-4">
              <button
                type="button"
                onClick={() => setSelectedPlanet(null)}
                className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-xs font-medium text-neutral-300 transition hover:bg-white/[0.08] hover:text-white"
              >
                Close
              </button>
              {onExploreWorkspace && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPlanet(null);
                    onExploreWorkspace();
                  }}
                  className="rounded-xl bg-white px-4 py-2 text-xs font-semibold text-black transition hover:bg-neutral-200"
                >
                  Open in Workspace →
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
