#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

docker build \
    --tag codeforge-test-runner:py311 \
    "$ROOT_DIR/backend/sandbox"
