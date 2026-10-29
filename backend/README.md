# CodeForge AI Backend

FastAPI backend for CodeForge AI. It provides the rebuilt application foundation plus the ported
project, workflow-run, agent, artifact, and sandbox functionality.

## Requirements

- Python 3.11
- [uv](https://docs.astral.sh/uv/)
- PostgreSQL for the default configuration, or SQLite for a local fallback
- Docker for generated-project test execution
- A DeepSeek API key for live workflow runs

## Local development

```bash
cd backend
uv sync --all-groups
uv run uvicorn app.main:app --reload
```

The API is available at `http://localhost:8000`, with OpenAPI documentation at
`http://localhost:8000/docs`.

Health check:

```bash
curl http://localhost:8000/api/v1/health
```

### Database

The default database URL is PostgreSQL. Apply migrations once PostgreSQL is running:

```bash
uv run alembic upgrade head
```

For a SQLite fallback that needs no database server:

```bash
CODEFORGE_DATABASE_URL=sqlite:///./codeforge.db uv run uvicorn app.main:app --reload
```

SQLite tables are created automatically at application startup.

### Configuration

Settings are read from environment variables with the `CODEFORGE_` prefix. The root `.env` file is
loaded automatically when present. See `.env.example` in the repository root for placeholders.

`DEEPSEEK_API_KEY` is read without the prefix and is required for live workflow execution.

## API

- `GET /api/v1/health`
- `POST /api/v1/projects`
- `GET /api/v1/projects`
- `GET /api/v1/projects/{project_id}`
- `POST /api/v1/projects/{project_id}/runs`
- `GET /api/v1/projects/{project_id}/runs`
- `GET /api/v1/projects/{project_id}/runs/{run_id}`
- `GET /api/v1/projects/{project_id}/runs/{run_id}/artifacts`
- `PATCH /api/v1/projects/{project_id}/runs/{run_id}/approval`

Creating a workflow run schedules background execution and returns immediately. Approval decisions
are only accepted for completed runs and are stored on the run.

## Sandbox tests

Generated-project tests run in the `codeforge-test-runner:py311` image. Build it from the
repository root:

```bash
./scripts/build-sandbox-image.sh
```

The Docker sandbox integration tests skip automatically when the image is unavailable.

## Checks

```bash
uv run ruff check .
uv run ruff format --check .
uv run mypy app
uv run pytest
```

The current test suite runs persistence tests against SQLite with foreign keys enabled. Docker
sandbox tests require the image above. Alembic migrations can be checked with:

```bash
CODEFORGE_DATABASE_URL=sqlite:////tmp/codeforge-check.db uv run alembic upgrade head
CODEFORGE_DATABASE_URL=sqlite:////tmp/codeforge-check.db uv run alembic downgrade base
```
