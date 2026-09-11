# Campus Clubs Hub hosting guide

The downloadable source archive contains the full pnpm workspace: the web app, API server, database schema, seed data, generated API client, OpenAPI contract, and deployment configuration.

## Recommended: publish on Replit

This is the easiest option because the project already has:

- A React/Vite web artifact
- A separate Express API artifact
- PostgreSQL schema and first-run seed data
- Production build settings for both services

1. Open the project in Replit.
2. Make sure the development database is available.
3. Open **Publish**.
4. Choose the default web deployment option.
5. Publish the project.
6. If this is the first publish, review the database schema change and approve it so the production database receives the tables and seed data.
7. Use the generated `.replit.app` URL to share the website.

Replit supplies the production `PORT` values from the artifact configuration. The production API runs at `/api`, and the web app serves at `/`.

## Run it locally

Requirements:

- Node.js 24 or newer
- pnpm
- PostgreSQL

From the project root:

```bash
pnpm install
export DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE"
pnpm --filter @workspace/db run push
pnpm --filter @workspace/api-server run dev
```

In a second terminal:

```bash
PORT=23905 BASE_PATH=/ pnpm --filter @workspace/campus-clubs-hub run dev
```

The API will listen on port `8080` and the web app on port `23905`.

## Host on another platform

Use one service for the API and one static site service for the frontend.

### API service

Build command:

```bash
pnpm install --frozen-lockfile
pnpm --filter @workspace/db run push
pnpm --filter @workspace/api-server run build
```

Start command:

```bash
node --enable-source-maps artifacts/api-server/dist/index.mjs
```

Environment variables:

```text
DATABASE_URL=your-postgres-connection-string
NODE_ENV=production
PORT=8080
```

The API health check is:

```text
/api/healthz
```

### Frontend service

Build command:

```bash
pnpm install --frozen-lockfile
PORT=23905 BASE_PATH=/ pnpm --filter @workspace/campus-clubs-hub run build
```

Publish directory:

```text
artifacts/campus-clubs-hub/dist/public
```

Configure the frontend host with an SPA fallback so unknown paths serve `index.html`.

Configure a reverse proxy so:

```text
/api/* → API service
/*     → frontend static files
```

The frontend calls `/api` using relative URLs. Keeping both services behind one public domain avoids CORS and URL configuration changes.

## Important database note

The API seeds 500 clubs, leadership roles, and sample events the first time it starts against an empty database. Back up an existing database before running `pnpm --filter @workspace/db run push`.

## Where to customize the data

- `artifacts/api-server/src/seed.ts` — initial clubs, roles, and events
- `lib/db/src/schema/` — PostgreSQL schema
- `lib/api-spec/openapi.yaml` — API contract
- `artifacts/campus-clubs-hub/src/` — frontend pages and styling
