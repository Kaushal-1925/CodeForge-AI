# CodeForge AI

CodeForge AI is an autonomous multi-agent software engineering platform. Describe an application in
natural language and a coordinated workflow plans requirements, designs an architecture, writes
code, validates artifacts, and runs tests in a restricted Docker sandbox.

The project is being rebuilt on the `rebuild` branch. The rebuilt foundation, the ported backend
feature set, and the workflow dashboard are implemented and locally verified. Docker sandbox and
PostgreSQL acceptance, live-provider validation, streaming updates, and production hardening are
still pending. Only behavior that actually exists is presented as working. See
[`docs/CURRENT_STATE.md`](docs/CURRENT_STATE.md) and
[`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md).

## What works

- FastAPI application with typed settings, JSON logging, request IDs, CORS, and OpenAPI docs.
- PostgreSQL persistence with SQLAlchemy and Alembic, plus a SQLite fallback for local runs.
- Project API: create, list, and get projects.
- Workflow-run API: create, list, get, list generated artifacts, and record an approval decision.
- LangGraph workflow with manager, architect, task planner, developer, validator, tester, artifact
  writer, retries, and persisted run status.
- DeepSeek LLM integration through environment configuration.
- Sandboxed Docker test execution with no network, non-root user, resource limits, and a read-only
  workspace.
- Next.js workflow dashboard with project creation, run submission, live status polling, artifact
  review, and persisted approve/reject decisions.

## Structure

```text
backend/    FastAPI application, agents, workflow, migrations, and tests
frontend/   Next.js dashboard and tests
docs/       Implementation plan, current state, and reference PRD
scripts/    Local verification and sandbox image scripts
```

## Quick start

Start the full stack with Docker Compose:

```bash
cp .env.example .env
# Set DEEPSEEK_API_KEY in .env
docker compose up --build
```

The API is available at `http://localhost:8000` with documentation at
`http://localhost:8000/docs`. The dashboard is available at `http://localhost:3000`.

To run the backend directly on the host:

```bash
cd backend
uv sync --all-groups
uv run alembic upgrade head
uv run uvicorn app.main:app --reload
```

To use a local SQLite database instead of PostgreSQL:

```bash
cd backend
CODEFORGE_DATABASE_URL=sqlite:///./codeforge.db uv run uvicorn app.main:app --reload
```

The application creates SQLite tables automatically at startup. PostgreSQL requires the Alembic
migration step.

Start the dashboard in another terminal:

```bash
cd frontend
npm install
npm run dev
```

## Generated-project test execution

Workflow runs use the Docker image `codeforge-test-runner:py311`. Build it once:

```bash
./scripts/build-sandbox-image.sh
```

The backend process must be able to reach a Docker daemon. When the backend itself runs in a
container, the sandbox image and Docker access must be provided by that environment.

## Environment

Copy `.env.example` to `.env` and set values as needed. Important variables:

- `CODEFORGE_DATABASE_URL`: SQLAlchemy URL, PostgreSQL by default.
- `CODEFORGE_LLM_MODEL`: DeepSeek model name.
- `DEEPSEEK_API_KEY`: required to execute live workflows.
- `NEXT_PUBLIC_API_BASE_URL`: frontend API base URL.

Never commit real credentials.

## Checks

```bash
./scripts/check.sh
```

The canonical script runs backend lint, format, type checks, and tests, then frontend lint, format,
type checks, tests, and production build. Docker sandbox tests skip automatically when the sandbox
image is unavailable.

The legacy implementation is preserved on `master` and the `legacy-v1` tag for reference only.
