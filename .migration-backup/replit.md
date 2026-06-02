# CashCollect

Ice Cream Parlor Collection Management — helps field agents record daily cash, coupon, and credit card collections from parlors and submit them for supervisor acknowledgment.

## Run & Operate

- `pnpm --filter @workspace/cashcollect run dev` — run the frontend (Vite, port from workflow)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite (artifact: `artifacts/cashcollect/`)
- API: Express 5 (`artifacts/api-server/`)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- Routing: wouter
- UI: Tailwind CSS v4, shadcn/ui components, DM Sans font
- Charts: Recharts
- Forms: react-hook-form
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/cashcollect/src/app/` — page components (Next.js-style folders → wouter routes)
- `artifacts/cashcollect/src/components/` — shared components (AppLayout, Sidebar, UI)
- `artifacts/cashcollect/src/App.tsx` — router setup with wouter
- `artifacts/cashcollect/src/index.css` — theme variables (HSL values for all CSS vars)
- `lib/api-spec/openapi.yaml` — OpenAPI source of truth
- `lib/db/src/schema/` — Drizzle ORM schema

## Architecture decisions

- Migrated from Next.js 15 to Vite + React + wouter (Next.js not supported as Replit artifact type)
- All `next/link` replaced with wouter `<Link>`, `next/navigation` with wouter `useLocation`
- `next/image` replaced with plain `<img>` tags (AppImage component)
- `next/dynamic` removed; `SummaryBarChart` imported directly (no SSR needed)
- `next-themes` removed; sonner Toaster uses `theme="light"` directly
- App uses mock data throughout (no backend integration yet); backend integration points marked with comments

## Product

- **Login page** — role-based auth (Agent, Supervisor, Super Admin) with demo credential autofill
- **Daily Collection Entry** — parlor list with status badges, entry form for cash/coupon/card amounts, supervisor acknowledgment panel
- **Reports** — detailed and summary tabs with date/collector/parlor/status filters, sortable tables, bar chart
- **Parlor Master** — Excel/CSV upload for parlor master data (super-admin only)

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Do NOT run `pnpm dev` at workspace root — use `restart_workflow` or filter with `--filter`
- The app is purely frontend with mock data — API routes are not yet connected
- CSS theme uses HSL values for Tailwind v4 (e.g. `213 72% 28%`, not `hsl(...)`)
- `xlsx` package is pinned to `0.18.5` (same as original)

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
