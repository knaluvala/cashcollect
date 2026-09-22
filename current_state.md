# CashCollect — Current State

_Last updated: 2026-09-22_

## What it is
A field cash-collection tracking system. Agents collect cash/coupon/credit-card
payments across "parlors" grouped into "routes"; each collection moves through a
status lifecycle (`entered → submitted → acknowledged`), with super-admin oversight
for parlor management, route management, and user management.

## Tech stack
- pnpm monorepo, TypeScript throughout.
- **Backend** ([artifacts/api-server](artifacts/api-server)): Express 5, JWT/bcrypt auth,
  pino logging, Drizzle ORM over Postgres.
- **Web** ([artifacts/cashcollect](artifacts/cashcollect)): React 19, Vite 7, wouter,
  TanStack Query, Tailwind 4 + Radix UI.
- **Mobile** ([artifacts/cashcollect-mobile](artifacts/cashcollect-mobile)): Expo /
  React Native, expo-router, shares the same data layer as web.
- **Sandbox** ([artifacts/mockup-sandbox](artifacts/mockup-sandbox)): standalone Vite/React
  playground for UI mockups — intentionally not wired to the real backend.

## Architectural decisions
- **OpenAPI-first contract**: [lib/api-spec](lib/api-spec)'s `openapi.yaml` is the single
  source of truth. `orval` codegen produces two consumers from it:
  - [lib/api-client-react](lib/api-client-react) — React Query hooks, shared by web and mobile.
  - [lib/api-zod](lib/api-zod) — Zod validators, used by api-server to validate requests.
- **Single backend, shared clients**: both web and mobile hit the same api-server
  over HTTP through the generated client — no duplicated fetch logic per platform.
- **Drizzle as the domain model**: [lib/db](lib/db) defines `pgTable` schemas paired with
  `drizzle-zod`-derived insert/update schemas and inferred TS types. This is
  intentionally separate from the orval-generated `api-zod` (HTTP contract validation
  vs. domain/DB validation are two different layers).
- **Migrations via `drizzle-kit push`** (no separate migration-file workflow currently).
- `server.js` at the repo root is an unrelated standalone Express helper (OpenRouter
  AI proxy) — not part of the CashCollect data flow.

## Core data models (lib/db/src/schema)
- `users`
- `parlors`
- `routes` / `route_parlors` (route-to-parlor assignments)
- `collections` (cashAmount, couponAmount, ccAmount, status lifecycle,
  submittedAt/acknowledgedAt/acknowledgedBy)
- `external_collection_config`

## Data flow
```
cashcollect (web) ─┐
                    ├─ api-client-react ─→ HTTP /api ─→ api-server ─→ api-zod (validation) ─→ db (Drizzle/Postgres)
cashcollect-mobile ─┘
```

## Recent activity (from git log)
- Require superadmin auth for user-management endpoints
- Fix inconsistent return paths in Settings `changePassword`
- Restore External Amounts settings tab
- Raise vite-plugin-pwa's precache size limit
- Add `.env.example` files for api-server and mobile app

## Gaps / notes
- No README.md or CLAUDE.md exists anywhere in the repo; this document and prior
  in-session exploration are currently the only architecture notes.
- `mockup-sandbox` has no workspace API/db dependencies by design — treat it as
  disposable prototyping, not production code.
