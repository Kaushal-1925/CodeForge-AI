# Running CodeForge AI on Another PC

This guide walks through a clean, end-to-end setup of CodeForge AI on a separate machine
(x64 Intel laptop recommended). The code is pushed to the `aromatic-wander` branch of
https://github.com/Kaushal-1925/CodeForge-AI.git.

## 1. Prerequisites (install on the new PC)

| Tool | Version | Notes |
|------|---------|-------|
| Python | 3.11.x | Required exactly (`pyproject.toml` pins `>=3.11,<3.12`) |
| Node.js | 22.x | `>=22.22.2 <23` (frontend engines field) |
| uv | latest | Python installer / package manager |
| npm | bundled with Node | Frontend package manager |
| Docker Desktop | any recent | Optional. Needed for PostgreSQL + sandbox test acceptance |

Install uv:

```bash
# Windows (PowerShell)
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"

# macOS / Linux
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Verify:

```bash
python --version      # 3.11.x
node --version        # v22.x
uv --version
npm --version
```

## 2. Clone the repository

```bash
git clone https://github.com/Kaushal-1925/CodeForge-AI.git
cd CodeForge-AI
git checkout aromatic-wander
```

The `aromatic-wander` branch contains the full rebuilt backend, frontend, migrations, and
documentation. `master` preserves the legacy implementation for reference only.

## 3. Configure the environment

Copy the example env file and fill in real values:

```bash
cp .env.example .env
```

Edit `.env` and set at minimum:

- `DEEPSEEK_API_KEY` — required for live agent/workflow runs. Without it, runs fail at the LLM step
  with a clear error message. Never commit real keys.
- `CODEFORGE_DATABASE_URL` — defaults to PostgreSQL. For a no-database-server local run, use SQLite:
  `CODEFORGE_DATABASE_URL=sqlite:///./codeforge.db`
- `CODEFORGE_CORS_ORIGINS` — `http://localhost:3000` for local frontend.
- `NEXT_PUBLIC_API_BASE_URL` — frontend API base, e.g. `http://localhost:8000/api/v1`
  (put this in `frontend/.env.local`, not the root `.env`).

Example root `.env` for a SQLite local run:

```ini
CODEFORGE_ENVIRONMENT=development
CODEFORGE_LOG_LEVEL=INFO
CODEFORGE_CORS_ORIGINS=http://localhost:3000
CODEFORGE_DATABASE_URL=sqlite:///./codeforge.db
CODEFORGE_LLM_PROVIDER=deepseek
CODEFORGE_LLM_MODEL=deepseek-chat
DEEPSEEK_API_KEY=sk-...your-real-key...
```

Example `frontend/.env.local`:

```ini
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

## 4. Run the backend

Open a terminal in `backend/`:

```bash
cd backend
uv sync --all-groups
```

Run the verification checks (should all pass):

```bash
uv run ruff check .
uv run ruff format --check .
uv run mypy app
uv run pytest
```

Apply database migrations (PostgreSQL only; SQLite creates tables automatically):

```bash
# If using PostgreSQL
uv run alembic upgrade head
```

Start the API server:

```bash
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Verify it is reachable:

```bash
curl http://localhost:8000/api/v1/health
```

The API is at `http://localhost:8000`; OpenAPI docs at `http://localhost:8000/docs`.

Keep this terminal running — the backend must stay up for the frontend to work.

## 5. Run the frontend

Open a **second** terminal in `frontend/`:

```bash
cd ../frontend
npm ci
npm run dev
```

The dashboard is available at **http://localhost:3000**.

## 6. Verify end-to-end

1. Open http://localhost:3000 in your browser.
2. Create a project (name + requirements).
3. Submit a workflow run. The dashboard polls run status every 2.5 seconds while active.
4. When complete, review generated artifacts in the run detail page.
5. Persist an approve/reject decision through the approval controls.

## 7. Optional: Docker / PostgreSQL acceptance

From the repository root:

```bash
docker compose up -d postgres
cd backend
CODEFORGE_DATABASE_URL=postgresql+psycopg://codeforge:codeforge_password@localhost:5432/codeforge \
    uv run alembic upgrade head
```

Build and run the sandbox test image:

```bash
./scripts/build-sandbox-image.sh
cd backend
uv run pytest tests/test_generated_project_execution.py
```

Docker sandbox tests skip automatically when the image/daemon is unavailable.

## 8. One-command full check (x64)

From the repository root:

```bash
./scripts/check.sh
```

This runs backend lint, format, type checks, and tests, then frontend lint, format, type checks,
tests, and production build.

## Environment recap

- Backend: `http://localhost:8000`
- Frontend dashboard: `http://localhost:3000`
- Backend venv: `backend/.venv` (gitignored, created by `uv sync`)
- Frontend modules: `frontend/node_modules` (gitignored, created by `npm ci`)
- Local SQLite DB: created automatically at `codeforge.db` next to the backend when using SQLite

## Branch notes

- `aromatic-wander` — current rebuilt code (this branch).
- `master` — legacy implementation, preserved for reference.
- `legacy-v1` — tag on the legacy tip.

Do not push real API keys or secrets to GitHub.
