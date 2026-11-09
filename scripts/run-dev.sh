#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "================================================="
echo "         CodeForge AI Multi-Agent System         "
echo "================================================="

# Ensure ports are free
fuser -k 8000/tcp 2>/dev/null || true
fuser -k 3000/tcp 2>/dev/null || true

# Create .env if not present
if [ ! -f "$ROOT_DIR/.env" ]; then
    echo "[!] Creating .env from .env.example..."
    cp "$ROOT_DIR/.env.example" "$ROOT_DIR/.env"
fi

if [ ! -f "$ROOT_DIR/frontend/.env.local" ]; then
    echo "NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1" > "$ROOT_DIR/frontend/.env.local"
fi

cleanup() {
    echo ""
    echo "[!] Stopping servers..."
    kill $(jobs -p) 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "[+] Starting FastAPI backend on http://127.0.0.1:8000..."
cd "$ROOT_DIR/backend"
CODEFORGE_DATABASE_URL="sqlite:///./codeforge.db" uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &

echo "[+] Starting Next.js frontend on http://localhost:3000..."
cd "$ROOT_DIR/frontend"
npm run dev -- --port 3000 -H 0.0.0.0 &

echo ""
echo "[✓] Servers running! Press Ctrl+C to stop."
echo "    - Dashboard: http://localhost:3000"
echo "    - API Docs:  http://localhost:8000/docs"
echo ""

wait
