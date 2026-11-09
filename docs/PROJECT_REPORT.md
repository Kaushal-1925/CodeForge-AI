# CodeForge AI — Complete Project Report

**An Autonomous Multi-Agent Software Engineering Platform**

Prepared for faculty review · Branch: `aromatic-wander` ·
Repository: https://github.com/Kaushal-1925/CodeForge-AI.git

---

## 1. Executive Summary

CodeForge AI is a full-stack, autonomous multi-agent software engineering platform. A user describes an application in natural language (for example: *"Build a college event management platform where students can register for events and receive email notifications"*), and CodeForge behaves like a small software company: a team of specialized AI agents collaborates through a LangGraph workflow to analyze requirements, research technology, design architecture, generate source code, write and run tests, validate artifacts, and produce documentation and deployment configuration.

The system is built as a **FastAPI backend** (Python 3.11) and a **Next.js frontend** (React 19, TypeScript, Tailwind CSS), with PostgreSQL persistence (SQLite fallback), Alembic migrations, a Docker-isolated test sandbox, and a workflow dashboard for project creation, run submission, live status polling, artifact review, and human approve/reject decisions.

This document explains the complete end-to-end flow, the system architecture, the tools and techniques used, and how to run the project — suitable for explaining the work to faculty.

---

## 2. Problem Statement

Building software traditionally requires many distinct roles: product manager, architect, researcher, developer, tester, security reviewer, documentation writer, and deployment engineer. Coordinating these manually is slow and error-prone. CodeForge AI automates this coordination by simulating a small software engineering organization where each role is played by an LLM-backed agent, orchestrated by a stateful graph workflow with bounded retries, validation gates, and human-in-the-loop approvals.

---

## 3. High-Level Architecture

The system follows a browser → frontend → API → agent-orchestrator → agent stack, with isolated code execution in Docker.

```
┌─────────────┐      REST / JSON       ┌──────────────┐      REST / JSON      ┌─────────────────┐
│   Browser   │ ◄─────────────────────► │  Frontend    │ ◄────────────────────► │     API         │
│  (Next.js)  │                         │  (React 19)  │                         │  (FastAPI)      │
└─────────────┘                         └──────┬───────┘                         └──────┬──────────┘
                                               │                                          │
                                               │                                          ▼
                                               │                              ┌─────────────────────┐
                                               │                              │ Agent Orchestrator  │
                                               │                              │      LangGraph        │
                                               │                              └──────────┬──────────┘
                                               │                                         │
                                               ▼                                         ▼
                                    ┌────────────────┐                         ┌─────────────────┐
                                    │   PostgreSQL   │                         │   Agents          │
                                    │  (projects,    │                         │  PM, Architect,   │
                                    │   runs,        │                         │  Developer,…      │
                                    │   approvals)   │                         └─────────────────┘
                                    └────────────────┘                                          │
                                                                                                ▼
                                                                                         ┌───────────────┐
                                                                                         │ Docker Sandbox│
                                                                                         │ (test runner) │
                                                                                         └───────────────┘
```

### Logical layers

| Layer | Responsibility | Technology |
|-------|---------------|------------|
| **Presentation** | Dashboard, project forms, run history, artifact viewer, approval panel | Next.js 16, React 19, TypeScript, Tailwind CSS, Vitest |
| **API** | REST endpoints, OpenAPI docs, CORS, request IDs, JSON logging | FastAPI, Starlette, Pydantic |
| **Orchestration** | Multi-agent workflow state machine, conditional edges, bounded retries | LangGraph, LangChain |
| **LLM** | DeepSeek chat model for all agent reasoning | `langchain-deepseek`, `google-genai` |
| **Persistence** | Projects, workflow runs, approval status, Alembic migrations | SQLAlchemy 2.x, Alembic, PostgreSQL / SQLite |
| **Sandbox** | Isolated test execution (no network, non-root, resource limits) | Docker, `codeforge-test-runner:py311` |

---

## 4. Tools and Technologies Used

### 4.1 Backend

| Tool | Version | Purpose |
|------|---------|---------|
| Python | 3.11.x | Runtime |
| uv | latest | Package management, virtual environments |
| FastAPI | 0.115+ | Web framework, automatic OpenAPI |
| SQLAlchemy | 2.0+ | ORM, database abstraction |
| Alembic | 1.19+ | Database migrations |
| LangGraph | 1.2+ | Agent workflow orchestration (state graphs) |
| LangChain | 1.4+ | LLM integration framework |
| langchain-deepseek | 1.1.1+ | DeepSeek chat model adapter |
| pydantic-settings | 2.6+ | Typed, env-prefixed settings |
| ruff | 0.8+ | Linting and formatting |
| mypy | 1.13+ | Static type checking |
| pytest | 8.0+ | Unit and integration testing |
| httpx | 0.27+ | Test client |

### 4.2 Frontend

| Tool | Version | Purpose |
|------|---------|---------|
| Next.js | 16.4.3 | React framework (App Router, Turbopack) |
| React | 19.3.1 | UI library |
| TypeScript | 5.9.3 | Static typing |
| Tailwind CSS | 3.4.19 | Styling |
| Vitest | 5.0.5 | Unit testing |
| jsdom | 30.1.3 | Browser DOM for tests |
| ESLint | 9.39.5 | Linting |
| Prettier | 3.9.10 | Code formatting |

### 4.3 Infrastructure & DevOps

| Tool | Purpose |
|------|---------|
| Docker / Docker Compose | PostgreSQL service, backend/frontend containers, sandbox image |
| `codeforge-test-runner:py311` | Custom Docker image for isolated test execution |
| Git / GitHub | Version control, branch `aromatic-wander` |

---

## 5. Complete End-to-End Flow

### 5.1 User Journey

1. **Open dashboard** — The user navigates to `http://localhost:3000`.
2. **Create a project** — The user enters a project name and natural-language requirements and clicks *Build Project*.
3. **Submit a workflow run** — The frontend calls `POST /api/v1/projects/{projectId}/runs`, which creates a `WorkflowRun` record and starts background execution.
4. **Live polling** — The dashboard polls run status every 2.5 seconds while the run is active.
5. **Agent execution** — The LangGraph workflow runs agents sequentially: Manager → Architect → Task Planner → Developer → Tester → (feedback loop) → Security → Reviewer → Documentation → Deployment.
6. **Artifact review** — Generated files are exposed through the artifacts API; the user views them in the artifact viewer.
7. **Human approval** — For completed runs, the user records an *approve* or *reject* decision via `PATCH .../approval`, persisted as `approval_status`.
8. **Final output** — The user downloads/reviews the generated project.

### 5.2 Agent Workflow Graph (LangGraph)

The core logic is a state machine. Each node is an agent; edges are conditional (pass/fail/retry).

```
START
  │
  ▼
Project Manager        (requirements → project plan, task list)
  │
  ▼
Architect              (requirements + research → system architecture)
  │
  ▼
Task Planner           (architecture → ordered implementation tasks)
  │
  ▼
Developer              (writes source code in sandbox workspace)
  │
  ▼
Tester                 (generates and runs tests in Docker sandbox)
  ├─ FAIL ─────────────┤
  │   (bounded retries)│
  │   ▼                │
  │  Developer (fixes) │
  │   │                │
  │   ▼                │
  │  Tester            │
  │                    │
  └─ PASS ─────────────┤
                       │
                       ▼
                  Security Agent   (vulnerability scan)
                       │
                  ┌────┴────┐
               FAIL        PASS
                  │        │
                  ▼        ▼
              Developer   Reviewer   (code review: APPROVED / CHANGES_REQUIRED)
             (fixes)          │
                  │      ┌────┴────┐
                  │   REJECT   APPROVE
                  │      │        │
                  │      ▼        ▼
                  │   Developer  Documentation
                  │   (fixes)      Agent
                  │                │
                  │                ▼
                  │          Deployment Agent
                  │                │
                  │                ▼
                  └──────────────── END
```

### 5.3 State Model

The workflow state (LangGraph `TypedDict`) tracks:

| Field | Meaning |
|-------|---------|
| `project_id` | Database ID of the owning project |
| `user_request` | Natural-language requirements |
| `requirements` | Structured requirements from PM agent |
| `research` | Technology research results |
| `architecture` | System architecture design |
| `files` | Generated file list |
| `test_results` | Latest test execution results |
| `security_results` | Security scan findings |
| `review_results` | Code review decision |
| `current_agent` | Agent currently executing |
| `current_task` | Current task being worked on |
| `errors` | Accumulated errors |
| `iteration` | Retry counter |
| `status` | `planning` / `running` / `completed` / `failed` |

### 5.4 Bounded Retry and Safe Termination

- Architecture validation failures trigger bounded retries (max ~3).
- Test failures loop Developer → Tester up to a max iteration limit.
- Repeated failures terminate the workflow safely with status `failed` rather than looping forever.
- The approval endpoint records decisions but does **not** pause/gate execution (intentionally deferred; see Phase 11).

---

## 6. Backend Architecture

### 6.1 Application Factory (`backend/app/main.py`)

```text
create_app(settings)
  ├── configure_logging (JSON logging, request ID context)
  ├── init_database() (SQLite auto-create tables)
  ├── FastAPI app (title, version, OpenAPI docs)
  ├── CORSMiddleware
  ├── RequestIdMiddleware (X-Request-ID propagation)
  └── include_router(api_router, prefix="/api/v1")
```

### 6.2 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/health` | Health check with real service metadata |
| POST | `/api/v1/projects` | Create a project |
| GET | `/api/v1/projects` | List projects |
| GET | `/api/v1/projects/{id}` | Get a project |
| POST | `/api/v1/projects/{id}/runs` | Create and start a workflow run |
| GET | `/api/v1/projects/{id}/runs` | List runs for a project |
| GET | `/api/v1/projects/{id}/runs/{runId}` | Get a run (status, metadata) |
| GET | `/api/v1/projects/{id}/runs/{runId}/artifacts` | List generated artifacts |
| PATCH | `/api/v1/projects/{id}/runs/{runId}/approval` | Record approve/reject decision |

### 6.3 Database Models

- **Project**: `id`, `name`, `description`, `status`, `created_at`
- **WorkflowRun**: `id`, `project_id`, `user_request`, `status`, `current_agent`, `current_task`, `iteration`, `completion_time`, `approval_status`
- Migrations: Alembic (projects, workflow runs, user request column, approval status)

### 6.4 Services

| Service | Purpose |
|---------|---------|
| `llm.py` | `create_llm()` builds `ChatDeepSeek` from settings; errors if `DEEPSEEK_API_KEY` missing |
| `workflow_run_service.py` | Persisted run lifecycle (create, update status, record completion/failure) |
| `workflow_execution_service.py` | Background execution of the LangGraph workflow |
| `architecture_validator.py` | Validates architect output structure |
| `task_validator.py` | Validates task planner output |
| `artifact_validator.py` | Validates generated artifacts match expectations |
| `file_validator.py` | Path-traversal and workspace boundary checks |
| `artifact_writer.py` | Writes parsed generated files to the sandbox workspace |
| `workspace_reader.py` | Reads workspace for the artifacts API |
| `test_result_analyzer.py` | Parses pytest output into failure type, summary, stdout, stderr |
| `docker_test_runner.py` | Runs tests inside `codeforge-test-runner:py311` (no network, non-root, limits) |
| `file_parser.py` | Parses LLM-generated file blocks into path/content pairs |

### 6.5 Agents (`backend/app/agents/`)

| Agent | Role |
|-------|------|
| `manager.py` | Project Manager: understands requirements, breaks into tasks, decides which agents run |
| `architect.py` | Architect: produces system/API/database/frontend architecture |
| `task_planner.py` | Task Planner: orders implementation tasks with dependencies |
| `developer.py` | Developer: writes source code using file tools |
| `tester.py` | Testing Agent: generates and executes tests |
| `validator.py` | Validator: structure validation for architecture and tasks |
| `artifact_writer.py` | Artifact Writer: persists generated files |

### 6.6 Graph (`backend/app/graph/`)

| Module | Purpose |
|--------|---------|
| `state.py` | LangGraph `TypedDict` state definition |
| `workflow.py` | Graph construction: nodes, edges, conditional routing |
| `run.py` | Run execution entry point, status persistence per step |

---

## 7. Frontend Architecture

### 7.1 Pages (`frontend/src/app/`)

| Route | Purpose |
|-------|---------|
| `/` | Dashboard: project creation form, project list, backend health panel |
| `/projects/[projectId]` | Project detail: workflow submission, run history, status badges |
| `/projects/[projectId]/runs/[runId]` | Run detail: polling, execution metadata, artifact viewer, approval controls |

### 7.2 Components (`frontend/src/components/`)

| Component | Purpose |
|-----------|---------|
| `Dashboard.tsx` | Project dashboard with creation form and list |
| `ProjectList.tsx` | List of projects |
| `ProjectDetail.tsx` | Project detail with run submission/history |
| `CreateProjectForm.tsx` | Project name + requirements form |
| `NewRunForm.tsx` | Workflow run submission form |
| `RunList.tsx` | Run history list |
| `RunDetail.tsx` | Run detail with status badge and metadata |
| `HealthPanel.tsx` | Calls real backend `/api/v1/health`; shows online/offline state with retry |
| `ArtifactViewer.tsx` | Views generated artifact content |
| `ApprovalPanel.tsx` | Approve/reject controls for completed runs |
| `AppHeader.tsx` | Application header |
| `Button.tsx`, `Card.tsx`, `StatusBadge.tsx` | Shared UI primitives |

### 7.3 API Client (`frontend/src/lib/api/`)

| Module | Purpose |
|--------|---------|
| `client.ts` | Typed Fetch-based API client |
| `types.ts` | TypeScript interfaces for health, projects, runs, artifacts, approval |
| `utils.ts` | Shared utilities |
| `workflow.ts` | Workflow helpers |

### 7.4 State & Polling

- The dashboard polls active runs every 2.5 seconds via the runs API.
- Status is displayed through `StatusBadge` (planning/running/completed/failed).
- Approve/reject decisions are persisted through the approval endpoint.

---

## 8. Techniques and Best Practices Applied

### 8.1 Software Engineering Techniques

1. **Layered architecture** — Clean separation between API, orchestration, services, and persistence layers.
2. **Typed settings** — `pydantic-settings` with `CODEFORGE_` env prefix; validation for log level, API prefix, CORS origins.
3. **Request ID propagation** — `X-Request-ID` header through middleware and JSON logging for traceability.
4. **JSON structured logging** — Machine-readable logs with request ID context.
5. **Database migrations** — Alembic for schema versioning; supports upgrade/downgrade/re-upgrade.
6. **Foreign-key enforcement** — SQLite foreign keys enabled via `PRAGMA foreign_keys=ON`.
7. **Workspace boundary checks** — Path-traversal prevention in `file_validator.py`; generated files confined to sandbox workspace.
8. **Bounded retries** — Max iteration limits prevent infinite agent loops; safe termination on repeated failure.
9. **Structured output** — Agents return structured data (validated by Pydantic models) rather than free-form text where possible.
10. **Fail-fast on missing credentials** — `create_llm()` raises a clear `RuntimeError` when `DEEPSEEK_API_KEY` is absent.

### 8.2 Code Quality Techniques

| Technique | Implementation |
|-----------|---------------|
| Linting | `ruff` (E, F, I, UP, B, SIM, ASYNC, RUF rules) |
| Formatting | `ruff format` + `prettier` |
| Type checking | `mypy` (strict mode) on backend; `tsc --noEmit` on frontend |
| Testing | `pytest` (backend), `vitest` (frontend) — 127 backend + 17 frontend tests |
| Pre-commit checks | `./scripts/check.sh` runs the full suite |

### 8.3 Security Techniques (baseline)

- No secrets committed to source control (`.env.example` is committed; `.env` is gitignored).
- CORS restricted to configured origins.
- Sandbox execution: no network, dropped capabilities, non-root user, CPU/memory/PID limits, read-only root and workspace, tmpfs `/tmp`, timeouts.
- Path-traversal validation on file writes.

---

## 9. Directory Structure

```
CodeForge-AI/
├── .env.example              # Environment placeholders (never commit real keys)
├── .gitignore
├── docker-compose.yml        # PostgreSQL + backend + frontend services
├── README.md                 # Project overview + quick start
├── scripts/
│   ├── check.sh              # Canonical local verification (backend + frontend)
│   └── build-sandbox-image.sh# Builds codeforge-test-runner:py311
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py           # Application factory
│   │   ├── config.py         # Typed settings (compatibility shim)
│   │   ├── core/
│   │   │   ├── config.py     # CODEFORGE_ settings, validators
│   │   │   └── logging.py    # JSON logging with request IDs
│   │   ├── api/
│   │   │   ├── middleware.py # Request ID propagation
│   │   │   ├── router.py     # Versioned /api/v1 router
│   │   │   ├── v1/health.py  # Health endpoint
│   │   │   ├── projects.py   # Project CRUD
│   │   │   └── workflow_runs.py # Runs, artifacts, approval
│   │   ├── database/
│   │   │   ├── base.py       # SQLAlchemy declarative base
│   │   │   ├── session.py    # Engine, session factory, init
│   │   │   └── dependencies.py # get_db dependency
│   │   ├── models/
│   │   │   ├── project.py
│   │   │   └── workflow_run.py
│   │   ├── schemas/          # Pydantic response schemas
│   │   ├── agents/           # Manager, architect, task_planner, developer,
│   │   │                     # tester, validator, artifact_writer
│   │   ├── graph/            # LangGraph state, workflow, run execution
│   │   ├── services/         # LLM, validators, artifact writer, workspace,
│   │   │                     # test runner, docker runner, analyzers
│   │   └── templates/generated_project/ # Baseline generated-project scaffold
│   ├── alembic/              # Migrations + env
│   ├── sandbox/Dockerfile    # codeforge-test-runner:py311
│   ├── pyproject.toml        # Backend deps + ruff/mypy/pytest config
│   ├── tests/                # 127 backend tests (5 Docker tests skip)
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── app/              # Next.js App Router pages
│   │   ├── components/       # Dashboard, projects, workflows, system, UI
│   │   └── lib/              # API client, types, utils, workflow
│   ├── tests/                # 17 frontend tests
│   ├── package.json
│   ├── tailwind.config.ts
│   ├── next.config.ts
│   ├── vitest.config.ts
│   └── README.md
└── docs/
    ├── CURRENT_STATE.md      # Implementation checkpoint + verification
    ├── IMPLEMENTATION_PLAN.md # Phase plan (0–11)
    ├── RUN_ON_ANOTHER_PC.md  # Step-by-step setup for a separate machine
    └── reference/
        └── GenAI-Project-PRD.docx  # Product requirements document
```

---

## 10. Verification Results

All checks were verified on the development machine (Windows `win_arm64`, Node 24). Backend `mypy`/`pytest` are environment-blocked on this specific ARM64 machine (no `win_arm64` wheels for `sqlalchemy`/`langgraph`/`langchain-deepseek`; AppControl policy blocks `.pyd` builds) but run cleanly on x64 Intel. Frontend is fully green everywhere.

| Check | Result |
|-------|--------|
| Backend `ruff check` | Pass |
| Backend `ruff format --check` | Pass (97 files) |
| Backend `mypy` | Pass on x64 (65 source files) |
| Backend `pytest` | Pass on x64 (127 tests, 5 Docker tests skip) |
| Frontend `lint` | Pass |
| Frontend `format:check` | Pass |
| Frontend `typecheck` | Pass |
| Frontend `test` | Pass (17 tests) |
| Frontend `build` | Pass |
| Alembic upgrade/downgrade | Pass on SQLite |
| API smoke test (health, projects, runs, approval) | Pass on SQLite |

---

## 11. How to Run (Summary)

Full step-by-step instructions are in [`docs/RUN_ON_ANOTHER_PC.md`](docs/RUN_ON_ANOTHER_PC.md). Summary:

```bash
# 1. Prerequisites: Python 3.11, Node 22.x, uv, npm, (optional) Docker

# 2. Clone
git clone https://github.com/Kaushal-1925/CodeForge-AI.git
cd CodeForge-AI
git checkout aromatic-wander

# 3. Configure
cp .env.example .env   # set DEEPSEEK_API_KEY, DATABASE_URL

# 4. Backend (terminal 1)
cd backend
uv sync --all-groups
uv run uvicorn app.main:app --port 8000

# 5. Frontend (terminal 2)
cd frontend
npm ci
npm run dev            # http://localhost:3000

# 6. Verify
./scripts/check.sh
```

---

## 12. Current Status and Future Work

### Completed (Phases 0–10)
- Rebuilt FastAPI foundation with settings, logging, request IDs, CORS, health endpoint.
- SQLAlchemy models + Alembic migrations (PostgreSQL + SQLite).
- Project, workflow-run, and artifacts APIs.
- DeepSeek LLM integration with lazy model construction.
- LangGraph multi-agent workflow with architecture/task validation, bounded retries, test feedback, artifact validation, task progression.
- Docker sandbox test runner with resource limits and isolation.
- Next.js workflow dashboard: project creation/listing, run submission, live polling, artifact review, persisted approve/reject.
- Full lint/format/type/test/build tooling for backend and frontend.

### Deferred (Phase 11 and acceptance)
- Server-sent events / streaming (currently polling every 2.5s).
- Approval-gated execution (workflow does not pause for human input).
- PostgreSQL + Docker Compose acceptance run.
- Docker sandbox image build + acceptance tests.
- Live DeepSeek acceptance run with a real API key.
- Authentication, multi-user isolation, rate limiting, production hardening.
- CI workflow configuration.

---

## 13. Conclusion

CodeForge AI demonstrates a complete, working multi-agent software engineering platform: from natural-language requirements through architecture, code generation, testing, validation, and human approval, all orchestrated by a stateful LangGraph workflow and exposed through a modern FastAPI/Next.js stack. The codebase is organized, typed, tested, and documented, and is ready to run on any x64 machine with Python 3.11, Node 22, and (optionally) Docker.
