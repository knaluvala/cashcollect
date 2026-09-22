# CashCollect

A field cash-collection tracking system. Agents record cash/coupon/credit-card
collections across "parlors" grouped into "routes"; each collection moves through a
status lifecycle (`entered → submitted → acknowledged`), with super-admin tooling
for parlor management, route management, and user management.

See [current_state.md](current_state.md) for a fuller architecture/progress summary.

## Structure

pnpm monorepo, TypeScript throughout.

```
artifacts/
  api-server        Express 5 REST API (JWT auth, Drizzle ORM, pino logging)
  cashcollect        Web app (React 19 + Vite + wouter + TanStack Query + Tailwind/Radix)
  cashcollect-mobile Mobile app (Expo / React Native, expo-router)
  mockup-sandbox     Standalone UI prototyping playground (not wired to the backend)
lib/
  api-spec           openapi.yaml — source of truth for the API contract
  api-client-react   Generated (orval) React Query client, shared by web + mobile
  api-zod            Generated (orval) Zod validators, used by api-server
  db                 Drizzle ORM schema + Postgres client
scripts/             Dev/setup scripts (start-*.sh/.ps1, preinstall check, post-merge)
server.js            Standalone Express AI-proxy helper (OpenRouter) — unrelated to the app
```

## Tech stack

- **Backend**: Express 5, JWT/bcrypt auth, pino logging, Drizzle ORM over Postgres.
- **Web**: React 19, Vite 7, wouter, TanStack Query, Tailwind 4 + Radix UI.
- **Mobile**: Expo / React Native, expo-router.
- **API contract**: OpenAPI-first — `lib/api-spec/openapi.yaml` codegens (via orval)
  into both the React Query client and the Zod validators.

## Getting started

```bash
pnpm install
```

Run the web app + API together:

```bash
pnpm dev          # bash (scripts/start-cashcollect-mobile.sh)
pnpm dev:win      # Windows PowerShell equivalent
```

Web-only dev server:

```bash
pnpm dev:web:win
```

Type-check and build:

```bash
pnpm typecheck
pnpm build
```

After pulling changes that touch dependencies or generated code:

```bash
pnpm postmerge:win   # Windows
```

## Notes

- No prior README/CLAUDE.md existed before this file — architecture was reconstructed
  by reading the code directly (see `current_state.md` for details).
- `mockup-sandbox` is intentionally disconnected from the real API/DB — treat it as
  disposable design work, not production code.
