# Campus Clubs Hub

An all-in-one campus directory for discovering 500 clubs, understanding membership and leadership opportunities, and registering for upcoming events.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/campus-clubs-hub` — React + Vite student-facing web app and theme.
- `artifacts/api-server/src/routes/campus.ts` — club, event, saved club, and registration API.
- `artifacts/api-server/src/seed.ts` — first-run directory and event seed data.
- `lib/api-spec/openapi.yaml` — source of truth for the generated API client and Zod contracts.
- `lib/db/src/schema/` — Drizzle tables for clubs, roles, events, saved clubs, and registrations.

## Architecture decisions

- The OpenAPI spec remains the source of truth; frontend hooks and server validation are generated from it.
- The first-run seed creates 500 searchable clubs and a representative event calendar so the app is useful before an admin import workflow exists.
- Saved clubs use a temporary current-student key until the product adds campus authentication; the API shape can remain unchanged when auth is introduced.

## Product

- Overview dashboard with campus counts, categories, featured clubs, and the next event.
- Searchable/filterable club directory with office location, eligibility, roles, responsibilities, and meeting details.
- Event explorer with venue, entry fee, registration criteria, available spots, and duty-leave visibility.
- Student actions for saving clubs and registering for events.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Run API codegen after changing `lib/api-spec/openapi.yaml`.
- Artifact builds need workflow-provided `PORT` and `BASE_PATH`; use the managed workflow or provide both variables for a manual build.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
