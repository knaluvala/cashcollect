#!/usr/bin/env bash
set -e

echo "Building API server..."
pnpm --filter @workspace/api-server build

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

echo "Starting CashCollect mobile web on 8082..."
PORT=8082 \
EXPO_PUBLIC_API_BASE_URL="https://$REPLIT_DEV_DOMAIN:3001" \
pnpm --filter @workspace/cashcollect-mobile dev