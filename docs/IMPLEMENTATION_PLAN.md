# CodeForge AI Implementation Plan

This plan is the checkpoint for the `rebuild` branch. The legacy implementation is preserved on
`master` and the `legacy-v1` tag. The rebuild replaces the legacy tree with a verifiable foundation
and then ports the legacy feature set onto that foundation. Do not restore legacy files wholesale;
use the tag only as a reviewed reference.

## Operating rules

- Never report an operation as successful unless it was actually executed and the real result was
  observed. Tests, builds, and workflow steps must report real output.
- Prefer structured, typed data over free-form communication between components.
- Keep generated code execution isolated from the host.
- Keep API keys and secrets out of source control.
- Preserve a working state at every checkpoint: backend lint, format, type checks, and tests, plus
  frontend lint, format, type checks, tests, and production build.
- Update this document and `docs/CURRENT_STATE.md` whenever a checkpoint moves.

## Phase status

| Phase | Scope                                                  | Status                                      |
| ----- | ------------------------------------------------------ | ------------------------------------------- |
| 0     | Inspection and rebuild plan                            | Complete                                    |
| 1     | Foundation, health check, and tooling                  | Complete                                    |
| 2     | Persistence and migrations                             | Implemented; SQLite-verified                |
| 3     | Core project-management API                            | Complete                                    |
| 4     | LLM provider integration                               | Implemented; live-provider check pending    |
| 5     | Requirements and planning workflow                     | Implemented and fake-verified               |
| 6     | Workspace tools and artifact generation                 | Complete                                    |
| 7     | Docker sandbox and automated test execution            | Implemented; Docker acceptance pending      |
| 8     | Developer and tester feedback loop                     | Implemented and fake-verified               |
| 9     | Workflow persistence, artifacts API, and streaming      | Persistence and artifacts complete; no SSE  |
| 10    | Workflow dashboard and approval decisions              | Complete; locally verified                  |
| 11    | Security review, evaluation, and production hardening  | Not started                                 |

The backend feature set was ported in a single integration pass because the repository owner
requested a complete working backend rather than continued phase-by-phase delivery. The phase list
above remains the map of what exists and what is still missing.

## Phase 0: Inspection and rebuild plan

Completed before the Phase 1 checkpoint.

- Inspected the legacy implementation and its history.
- Preserved the legacy code on `master` and the `legacy-v1` tag.
- Moved the product requirements document to `docs/reference/`.
- Defined a rebuild sequence that can be verified at each step.

## Phase 1: Foundation, health check, and tooling

Status: complete and verified on 2026-10-27, re-verified on 2026-10-28.

Deliverables:

- Backend application factory, environment-based settings, JSON logging, request IDs, CORS, and
  OpenAPI metadata.
- Versioned `/api/v1/health` endpoint returning real service metadata.
- Backend tests for the health endpoint, request ID behavior, OpenAPI schema, configuration, and
  logging.
- Next.js, TypeScript, Tailwind frontend foundation with a real backend health panel and API client.
- Frontend tests for the health panel success and failure states.
- Dockerfiles for the backend and frontend, environment placeholders, editor/line-ending settings,
  and a single local verification script.
- Checkpoint documentation in `docs/IMPLEMENTATION_PLAN.md` and `docs/CURRENT_STATE.md`.

Acceptance criteria:

- Backend `ruff check`, `ruff format --check`, `mypy`, and `pytest` pass.
- Frontend `lint`, `format:check`, `typecheck`, `test`, and `build` pass.
- The frontend health panel reads the real API and never fabricates a healthy state.

## Phase 2: Persistence and migrations

Status: implemented; SQLite-verified. PostgreSQL and Docker Compose acceptance are pending because
Docker is unavailable in the current environment.

Implemented:

- SQLAlchemy 2.x declarative base, session factory, database dependency, and models for `Project`
  and `WorkflowRun`.
- Environment-based connection settings, with SQLite support for local fallback and tests.
- Alembic configuration and three migrations covering projects, workflow runs, and the user
  request column.
- Docker Compose PostgreSQL service plus backend and frontend services.
- SQLite test fixtures with foreign-key enforcement.
- Service, model, API, and workflow persistence tests.

Remaining acceptance:

- `docker compose up` provides PostgreSQL.
- Migrations upgrade and downgrade cleanly against PostgreSQL.
- Backend tests run against PostgreSQL as well as SQLite.

## Phase 3: Core project-management API

Status: complete.

Implemented:

- Project model, schemas, and service usage.
- Create, list, and get project endpoints with validation and error handling.
- API and persistence tests.
- API remains versioned under `/api/v1`.

## Phase 4: LLM provider integration

Status: implemented; live-provider acceptance pending.

Implemented:

- DeepSeek configuration through central settings and `DEEPSEEK_API_KEY`.
- `create_llm()` with a clear failure when the key is missing.
- Lazy model construction so importing the application does not require credentials.
- Deterministic fake models in agent tests.
- Structured task-plan validation and safe workflow failure handling.

Remaining acceptance:

- Run the full workflow with a real DeepSeek key and record the observed result.

## Phase 5: Requirements and planning workflow

Status: implemented and fake-verified.

Implemented:

- Manager requirements, architect design, and task-planner steps.
- Architecture and task validators with bounded architecture retries.
- Persisted workflow-run state and observable step results.
- Safe termination on repeated failures.

## Phase 6: Workspace tools and artifact generation

Status: complete.

Implemented:

- Generated-project template copying.
- Generated-file parsing, validation, and artifact writing.
- Workspace boundary checks and artifact verification.
- Workspace reading for the artifacts API.
- Test coverage for path traversal, template copying, and artifact matching.

## Phase 7: Docker sandbox and automated test execution

Status: implemented; Docker acceptance pending.

Implemented:

- `backend/sandbox/Dockerfile` for the `codeforge-test-runner:py311` image.
- `scripts/build-sandbox-image.sh` to build the image.
- Docker runner with no network, dropped capabilities, non-root user, CPU/memory/PID limits,
  read-only root, read-only workspace, tmpfs `/tmp`, and timeouts.
- Integration tests for pass/fail, workspace immutability, non-root execution, timeouts, and host
  package isolation. These tests skip when the image is unavailable.

Remaining acceptance:

- Build the image and run the sandbox integration tests.
- Verify the backend environment can reach the Docker daemon for workflow execution.

## Phase 8: Developer and tester feedback loop

Status: implemented and fake-verified.

Implemented:

- Developer retries with structured test feedback.
- Test-result analysis with failure type, summary, details, stdout, and stderr.
- Retry bounds and max-retry termination.
- Task progression after passing tests.
- Workflow-run status persistence at each graph step.

## Phase 9: Workflow persistence and artifacts API

Status: persistence and artifacts complete; streaming is not implemented.

Implemented:

- Create, list, and get workflow-run endpoints scoped by project.
- Artifacts endpoint that reads the real run workspace.
- Persisted status, current agent, current task, iteration, and completion time.
- Background execution with failure persistence.

Remaining:

- Server-sent events or another streaming transport for live workflow updates.

## Phase 10: Workflow dashboard and approval decisions

Status: complete and locally verified on 2026-10-28.

Implemented:

- Project creation and listing dashboard with the real backend health panel.
- Project detail page with workflow-run submission, run history, and status badges.
- Run detail page with 2.5-second polling for active runs, execution metadata, and a generated
  artifact viewer.
- Persisted approve/reject decisions for completed runs through a new `approval_status` column,
  migration, API endpoint, and dashboard controls.
- Replaced the Phase 1 status page with the workflow dashboard.

Remaining:

- Streaming updates instead of polling.
- Approval-gated execution so a workflow can pause for human input before applying changes.

## Phase 11: Security review, evaluation, and production hardening

Status: not started.

Planned:

- Authentication and multi-user isolation.
- Rate limiting and request-size limits.
- Sandbox and secret-handling review.
- End-to-end evaluation with real providers.
- CI, deployment, and observability documentation.

## Verification commands

From the repository root:

```bash
./scripts/check.sh
```

Or run the checks individually:

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

Optional sandbox verification from the repository root:

```bash
./scripts/build-sandbox-image.sh
cd backend
uv run pytest tests/test_generated_project_execution.py
```

Optional approval endpoint smoke test with the backend running:

```bash
curl -X PATCH http://localhost:8000/api/v1/projects/<project_id>/runs/<run_id>/approval \
    -H 'Content-Type: application/json' \
    -d '{"approval_status": "approved"}'
```

Optional PostgreSQL verification from the repository root:

```bash
docker compose up -d postgres
cd backend
CODEFORGE_DATABASE_URL=postgresql+psycopg://codeforge:codeforge_password@localhost:5432/codeforge \
    uv run alembic upgrade head
```

Frontend tests can take 60-90 seconds on WSL when the repository is on a Windows-mounted drive.
That is environment latency, not a test failure.
