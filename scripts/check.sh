#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT_DIR/backend"
uv sync --all-groups
uv run ruff check .
uv run ruff format --check .
uv run mypy app
uv run pytest

cd "$ROOT_DIR/frontend"
npm ci
npm run lint
npm run format:check
npm run typecheck
npm test
npm run build
