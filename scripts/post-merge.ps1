$ErrorActionPreference = "Stop"
pnpm install --frozen-lockfile
pnpm --filter db push
