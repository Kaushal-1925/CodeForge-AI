# CodeForge AI Current State

Last checkpoint: 2026-10-29
Branch: `rebuild`
HEAD: `8ac5ae3` (`legacy-v1`, also `master` / `origin/master`)
Current phase: workflow dashboard checkpoint
Next work: Docker/PostgreSQL acceptance and live-provider validation

## Summary

The repository is on the `rebuild` branch. The legacy implementation is preserved on `master` and
the `legacy-v1` tag. The rebuilt foundation (Phase 0 and Phase 1) is in place, and the legacy
backend feature set has been ported onto that foundation:

- The application factory, typed settings, JSON logging, request IDs, CORS, and versioned
  `/api/v1/health` endpoint are rebuilt.
- SQLAlchemy models, Alembic migrations, project APIs, workflow-run APIs, and an artifacts API are
  wired into the rebuilt application.
- DeepSeek LLM configuration, the LangGraph agent workflow, workspace tools, artifact generation,
  and the Docker test runner were ported to the new configuration and package layout.
- The frontend is now a workflow dashboard: project creation and listing, run submission, live
  status polling, artifact review, and persisted approve/reject decisions.

All changes are still in the working tree and have not been committed. The staged change is the
PRD move to `docs/reference/`. The legacy deletions and the rebuild files are unstaged/untracked.
Do not discard those changes when resuming.

## Implemented

### Backend foundation

- `backend/app/main.py`: application factory, CORS, request ID middleware, versioned router, and
  SQLite database initialization for local fallback runs.
- `backend/app/core/config.py`: typed settings with `CODEFORGE_` environment prefix, `.env`
  loading, CORS list parsing, log-level validation, API prefix validation, database settings, and
  DeepSeek settings.
- `backend/app/core/logging.py`: JSON logging with request ID context.
- `backend/app/api/middleware.py`: request ID propagation via `X-Request-ID`.
- `backend/app/api/router.py` and `backend/app/api/v1/health.py`: `/api/v1/health` and OpenAPI.
- `backend/app/config.py`: compatibility shim for ported modules and Alembic.

### Persistence and APIs

- `backend/app/database/`: declarative base, session factory, dependency, and SQLite foreign-key
  enforcement.
- `backend/app/models/`: `Project` and `WorkflowRun` models.
- `backend/app/schemas/`: project, workflow-run, and artifact response schemas.
- `backend/app/api/projects.py`: create, list, and get projects.
- `backend/app/api/workflow_runs.py`: create, list, and get workflow runs, generated-artifact
  listing, and completed-run approval decisions.
- `backend/app/services/workflow_run_service.py` and
  `backend/app/services/workflow_execution_service.py`: persisted run lifecycle and background
  execution.
- `backend/alembic/`: configuration and four migrations (projects, workflow runs, user request,
  approval status).
- `docker-compose.yml`: PostgreSQL, backend, and frontend services.

### Agents and workflow

- `backend/app/services/llm.py`: DeepSeek-backed `ChatDeepSeek` created from settings and a
  clear error when `DEEPSEEK_API_KEY` is missing.
- `backend/app/agents/`: manager, architect, task planner, developer, tester, validator, and
  artifact writer agents.
- `backend/app/graph/`: LangGraph state and workflow with architecture/task validation, bounded
  retries, test feedback, artifact validation, and task progression.
- `backend/app/services/`: architecture/task/artifact/file validation, artifact writing, workspace
  reading, test-result analysis, and Docker test execution.
- `backend/app/templates/generated_project/`: baseline generated-project scaffold.

### Frontend

- Next.js 16, React 19, TypeScript, Tailwind workflow dashboard.
- `frontend/src/app/page.tsx`: project dashboard with creation form, project list, and backend
  health panel.
- `frontend/src/app/projects/[projectId]/page.tsx`: project detail with workflow submission and run
  history.
- `frontend/src/app/projects/[projectId]/runs/[runId]/page.tsx`: run detail with polling, execution
  metadata, artifact review, and approval controls.
- `frontend/src/components/system/HealthPanel.tsx`: calls the real backend health endpoint and
  shows loading, real metadata, or an actionable offline state with retry.
- `frontend/src/components/projects/`, `frontend/src/components/workflows/`,
  `frontend/src/components/dashboard/`: project forms and lists, run forms and lists, artifact
  viewer, and approval panel.
- `frontend/src/components/ui/`: `Button`, `Card`, and `StatusBadge`.
- `frontend/src/lib/api/`: typed API client and response types for health, projects, runs, artifacts,
  and approval decisions.
- `frontend/tests/`: dashboard, project form, run detail, artifact viewer, approval panel, workflow
  helper, and health panel tests.

### Tooling and repository

- `scripts/check.sh`: canonical local verification command.
- `scripts/build-sandbox-image.sh`: builds `codeforge-test-runner:py311` from
  `backend/sandbox/Dockerfile`.
- Root `.env.example`, `.dockerignore`, `.editorconfig`, `.gitattributes`, `.gitignore`.
- `frontend/.env.example`, `frontend/Dockerfile`, `frontend/.dockerignore`, ESLint, Prettier,
  Tailwind, Vitest, and TypeScript configuration.
- `docs/IMPLEMENTATION_PLAN.md` and this checkpoint document.

## Verification

Verified on 2026-10-28 in this environment:

| Check                                      | Result                                    |
| ------------------------------------------ | ----------------------------------------- |
| `uv run ruff check .`                      | Pass                                      |
| `uv run ruff format --check .`             | Pass                                      |
| `uv run mypy app`                          | Pass, 65 source files                     |
| `uv run pytest`                            | Pass, 127 tests, 5 skipped                |
| Alembic upgrade, downgrade, and re-upgrade | Pass on SQLite                            |
| Multi-step API smoke test on SQLite        | Pass (health, projects, runs, approval)   |
| `npm run lint`                             | Pass                                      |
| `npm run format:check`                     | Pass                                      |
| `npm run typecheck`                        | Pass                                      |
| `npm test`                                 | Pass, 17 tests                            |
| `npm run build`                            | Pass                                      |
| `./scripts/check.sh` end-to-end            | Pass                                      |

Re-verified on 2026-10-29 in this environment (Windows `win_arm64`, node 24):

| Check                                      | Result                                    |
| ------------------------------------------ | ----------------------------------------- |
| `ruff check .` (uv venv, CPython 3.11.17)  | Pass                                      |
| `ruff format --check .`                    | Pass, 97 files                            |
| `mypy app`                                 | Blocked: `langgraph`/`langchain-deepseek` |
|                                            | have no win_arm64 wheel; `app/services/`  |
|                                            | `llm.py` imports `langchain_deepseek`     |
| `pytest`                                   | Blocked: `sqlalchemy` C extensions and    |
|                                            | `langgraph` cannot be imported (AppControl|
|                                            | policy blocks `.pyd` loads; no win_arm64  |
|                                            | wheel for `langgraph`/`pyyaml`/`tiktoken`)|
| `npm run lint`                             | Pass                                      |
| `npm run format:check`                     | Pass                                      |
| `npm run typecheck`                        | Pass                                      |
| `npm test`                                 | Pass, 17 tests                            |
| `npm run build`                            | Pass                                      |

Notes:

- The five skipped backend tests are the Docker sandbox integration tests. Docker is not installed
  in this environment, so they skip with a message to build the sandbox image. They were not
  executed here.
- PostgreSQL and `docker compose up` were not verified here because Docker is unavailable.
  Persistence tests currently run against SQLite with foreign keys enabled.
- Live DeepSeek calls were not verified because no `DEEPSEEK_API_KEY` is configured in this
  environment. Agent behavior is covered with deterministic fakes.
- Backend tests emit one upstream `StarletteDeprecationWarning` from `TestClient`/`httpx`. It does
  not fail the suite.
- The approval endpoint records review decisions only. It does not pause or gate workflow
  execution, and it does not modify generated files.
- The live SQLite smoke test observed a run transition to `failed` because no `DEEPSEEK_API_KEY` is
  configured. It then set the run to `completed` directly and verified the real approval endpoint
  persisted `approved`.
- Frontend tests can take 60-90 seconds on WSL when the repository is on a Windows-mounted drive.
  The test run itself is fast once the jsdom environment loads.
- Environment limitation on this machine (`win_arm64`): `uv sync --all-groups` cannot install
  `psycopg-binary`, `pyyaml`, `langgraph`, `langchain-deepseek`, or `tiktoken` (no win_arm64
  wheels, and AppControl policy blocks source builds). `sqlalchemy` C extensions are also blocked
  at import time by AppControl. As a result backend `mypy` and `pytest` cannot run here; only
  `ruff check`/`ruff format` could be verified. Frontend checks all pass.

## Intentionally deferred

- Server-sent-event or streaming workflow updates. Run state is persisted and pollable through the
  API, and the dashboard polls it every 2.5 seconds while a run is active.
- Approval-gated execution. Approval decisions are recorded, but the workflow does not pause for
  human input.
- PostgreSQL-specific integration test run and Docker Compose acceptance run.
- Docker sandbox acceptance run and sandbox image build in this environment.
- Live DeepSeek acceptance run with a real API key.
- Authentication, multi-user isolation, rate limiting, and production hardening.
- CI workflow configuration. `scripts/check.sh` is the canonical check for now.

## Resume instructions

1. Read `docs/IMPLEMENTATION_PLAN.md` and this file.
2. Inspect `git status` and preserve the existing rebuild changes.
3. Run the checks below; they should stay green.
4. If Docker is available, build the sandbox image and run the five sandbox tests.

```bash
cd backend
uv sync --all-groups
uv run ruff check .
uv run ruff format --check .
uv run mypy app
uv run pytest

cd ../frontend
npm ci
npm run lint
npm run format:check
npm run typecheck
npm test
npm run build
```

Optional Docker checks from the repository root:

```bash
./scripts/build-sandbox-image.sh
cd backend
uv run pytest tests/test_generated_project_execution.py
```

Optional PostgreSQL check from the repository root:

```bash
docker compose up -d postgres
cd backend
CODEFORGE_DATABASE_URL=postgresql+psycopg://codeforge:codeforge_password@localhost:5432/codeforge \
    uv run alembic upgrade head
```

## Next phase gate

The workflow dashboard checkpoint is complete and verified as described above. Remaining work is
Docker sandbox acceptance, PostgreSQL/Docker Compose acceptance, live-provider validation,
streaming updates, approval-gated execution, and production hardening. No remaining work should be
reported as complete until it has actually been executed and observed.
