# Project context and agent instructions

Updated: 2025-10-27

## Overview

This is an Nx monorepo for Node.js/TypeScript services built with Express. It currently contains:

- @subkuch.store/api-gateway (Express app; Webpack build; serves static assets and `/api`)
- @subkuch.store/auth-service (Express app; esbuild build; simple API on root path)
- @subkuch.store/auth-service-e2e (Jest-based e2e tests targeting auth-service)

Nx is used for orchestration, caching, and task running. Always prefer `nx` tasks over raw tool CLIs.

## Projects at a glance

- @subkuch.store/api-gateway
  - Root: `apps/api-gateway`
  - Build: Webpack (`webpack-cli build`) via Nx
  - Serve targets:
    - Dev: `nx serve @subkuch.store/api-gateway` (depends on `build`)
    - Preview: `nx preview @subkuch.store/api-gateway` (webpack dev server in prod mode)
    - Static: `nx serve-static @subkuch.store/api-gateway`
  - Default port: `PORT` env (default 8080)
  - Endpoints: `GET /api` => `{ message: 'Welcome to api-gateway!' }`, static files under `/assets`

- @subkuch.store/auth-service
  - Root: `apps/auth-service`
  - Build: esbuild (`@nx/esbuild:esbuild`) out to `apps/auth-service/dist`
  - Serve: `nx serve @subkuch.store/auth-service` (runs built output with Node)
  - Docker: `nx docker:build @subkuch.store/auth-service`; `nx docker:run @subkuch.store/auth-service -- -p 3000:3000`
  - Default host/port: `HOST=localhost`, `PORT=6001`
  - Endpoints: `GET /` => `{ message: 'Hello API' }`

- @subkuch.store/auth-service-e2e
  - Root: `apps/auth-service-e2e`
  - Runner: Jest via `@nx/jest:jest`
  - Depends on: `@subkuch.store/auth-service:build` and `:serve`
  - Run: `nx e2e @subkuch.store/auth-service-e2e`

## Common commands (Windows PowerShell)

- Serve all apps (dev):

```powershell
npm run dev
```

- Serve one app:

```powershell
npx nx serve @subkuch.store/api-gateway
npx nx serve @subkuch.store/auth-service
```

- Build:

```powershell
npx nx build @subkuch.store/api-gateway
npx nx build @subkuch.store/auth-service
```

- Test and E2E:

```powershell
npx nx test @subkuch.store/auth-service
npx nx e2e @subkuch.store/auth-service-e2e
```

- Docker (auth-service):

```powershell
npx nx run @subkuch.store/auth-service:docker:build
npx nx run @subkuch.store/auth-service:docker:run -- -p 3000:3000
```

Notes:
- The root `package.json` defines `npm run dev` which runs `nx run-many --target=serve --all`.
- Nx caching is enabled; subsequent runs are fast when inputs haven’t changed.

## Environment

- api-gateway
  - `PORT` (default 8080)
- auth-service
  - `HOST` (default `localhost`)
  - `PORT` (default 6001)

## File structure highlights

- `apps/api-gateway/src/main.ts` — Express app exposing `/api` and static assets under `/assets`.
- `apps/auth-service/src/main.ts` — Express app exposing `/` greeting.
- `apps/auth-service-e2e/` — Jest e2e tests and setup files.
- `static/` — Additional static assets at repo root (not wired to an Nx app by default).

## Conventions and tips

- Use `npx nx <project>:<target>` over raw CLIs (webpack, jest, docker), to leverage Nx’s caching and dependency graph.
- For new services, prefer `apps/<service-name>` with TypeScript and Express; add Nx targets for `build`, `serve`, and optional `docker:*`.
- Keep ports non-conflicting; document them here when adding new services.
- Update this file and `AGENTS.md` when you add/rename projects or targets.

## Quick endpoints

- api-gateway
  - GET `http://localhost:8080/api` => `{ message: 'Welcome to api-gateway!' }`
- auth-service
  - GET `http://localhost:6001/` => `{ message: 'Hello API' }`

## Troubleshooting

- If a target isn’t found, list available targets:

```powershell
npx nx show project @subkuch.store/api-gateway
npx nx show project @subkuch.store/auth-service
```

- If webpack/esbuild errors occur, try a clean build:

```powershell
npx nx build @subkuch.store/api-gateway --skip-nx-cache
npx nx build @subkuch.store/auth-service --skip-nx-cache
```

