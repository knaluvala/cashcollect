#!/usr/bin/env bash
set -e

# Resolve paths relative to this script's location (workspace root)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DIST="$WORKSPACE_ROOT/artifacts/api-server/dist/index.mjs"

if [ ! -f "$DIST" ]; then
  echo "Building API server (first run)..."
  pnpm --filter @workspace/api-server build
else
  echo "Skipping API build — dist already exists."
fi

echo "Starting API server on 3000..."
PORT=3000 pnpm --filter @workspace/api-server start &

echo "Waiting for API server..."
for i in {1..30}; do
  if curl -s http://localhost:3000/api/healthz >/dev/null; then
    echo "API server is ready"
    break
  fi
  sleep 1
done

echo "Starting CashCollect frontend on 5173..."
PORT=5173 BASE_PATH=/ VITE_PORT=5173 pnpm --filter @workspace/cashcollect dev
