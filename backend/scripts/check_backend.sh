#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

export UV_CACHE_DIR="${UV_CACHE_DIR:-.uv-cache}"

uv run --with ruff ruff check src
uv run python -m compileall src
uv run pytest src/test/unit --cov=src/app --cov-fail-under=50
uv run pytest src/test/integration
