<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- You have access to the Nx MCP server and its tools, use them to help the user
- When answering questions about the repository, use the `nx_workspace` tool first to gain an understanding of the workspace architecture where applicable.
- When working in individual projects, use the `nx_project_details` mcp tool to analyze and understand the specific project structure and dependencies
- For questions around nx configuration, best practices or if you're unsure, use the `nx_docs` tool to get relevant, up-to-date docs. Always use this instead of assuming things about nx configuration
- If the user needs help with an Nx configuration or project graph error, use the `nx_workspace` tool to get any errors

# CI Error Guidelines

If the user wants help with fixing an error in their CI pipeline, use the following flow:
- Retrieve the list of current CI Pipeline Executions (CIPEs) using the `nx_cloud_cipe_details` tool
- If there are any errors, use the `nx_cloud_fix_cipe_failure` tool to retrieve the logs for a specific task
- Use the task logs to see what's wrong and help the user fix their problem. Use the appropriate tools if necessary
- Make sure that the problem is fixed by running the task that you passed into the `nx_cloud_fix_cipe_failure` tool


<!-- nx configuration end-->

## Workspace quick map

### Projects Overview

- **@subkuch.store/api-gateway** (`apps/api-gateway`)
  - Express API gateway with reverse proxy, rate limiting, and CORS
  - Build: Webpack 5
  - Default port: 8080 (via `PORT` env var)
  - Endpoints:
    - `GET /gateway-health` — Health check
    - `GET /` — Proxies to auth-service (http://localhost:6001)
  - Features: Rate limiting (100 unauthenticated, 1000 authenticated per 15min), request logging (morgan), cookie parsing

- **@subkuch.store/auth-service** (`apps/auth-service`)
  - Express authentication service with OTP-based user registration
  - Build: esbuild 0.19
  - Default host/port: `localhost:6001` (via `HOST` and `PORT` env vars)
  - Endpoints:
    - `GET /` — Health check (returns "Hello API")
    - `POST /api/user-registration` — OTP registration flow
  - Features: MongoDB (Prisma ORM), Redis caching, Nodemailer email delivery, Docker support
  - Dependencies: MongoDB, Redis (required)

- **@subkuch.store/auth-service-e2e** (`apps/auth-service-e2e`)
  - Jest-based end-to-end tests for auth-service
  - Depends on: `@subkuch.store/auth-service:build` and `:serve`
  - Run with: `npx nx e2e @subkuch.store/auth-service-e2e`

### Shared Packages

- **packages/error-handler** — Centralized error handling
  - Custom error classes: `AppError`, `ValidationError`, `AuthError`, `NotFoundError`, etc.
  - Express middleware: `errorMiddleware` for consistent JSON error responses

- **packages/libs/prisma** — MongoDB ORM client
  - Prisma Client singleton for database operations
  - Models: `users`, `images`
  - Generated client in: `generated/prisma/`

- **packages/libs/redis** — Redis client
  - ioredis singleton for OTP storage, rate limiting, cooldowns
  - Used for: OTP management, spam protection, request tracking

## Common Nx commands (Windows PowerShell)

### Development

- **Serve all apps (parallel development):**
	```powershell
	npm run dev
	# Runs: npx nx run-many --target=serve --all
	```

- **Serve individual app:**
	```powershell
	npx nx serve @subkuch.store/api-gateway
	npx nx serve @subkuch.store/auth-service
	```

### Build & Test

- **Build:**
	```powershell
	# Build all projects
	npx nx run-many -t build --all
	
	# Build specific project
	npx nx build @subkuch.store/api-gateway
	npx nx build @subkuch.store/auth-service
	
	# Build without cache (debugging)
	npx nx build @subkuch.store/auth-service --skip-nx-cache
	```

- **Test:**
	```powershell
	# Unit tests
	npx nx test @subkuch.store/auth-service
	
	# E2E tests
	npx nx e2e @subkuch.store/auth-service-e2e
	
	# TypeScript validation
	npx nx run-many -t typecheck --all
	```

### Docker

- **Docker (auth-service):**
	```powershell
	# Build Docker image
	npx nx run @subkuch.store/auth-service:docker:build
	
	# Run container (map port 3000)
	npx nx run @subkuch.store/auth-service:docker:run -- -p 3000:3000
	```

### Nx Utilities

- **Visualize workspace:**
	```powershell
	# Open dependency graph in browser
	npx nx graph
	
	# Show project details
	npx nx show project @subkuch.store/auth-service
	```

- **Cache management:**
	```powershell
	# Clear Nx cache
	npx nx reset
	```

### Database & Tools

- **Prisma:**
	```powershell
	# Generate Prisma client after schema changes
	npx prisma generate
	
	# Open Prisma Studio (database GUI)
	npx prisma studio
	
	# Push schema to database
	npx prisma db push
	```

- **Swagger (API docs):**
	```powershell
	cd apps/auth-service/src
	node swagger.mjs
	# Generates: swagger-output.json
	```

## Environment Setup

Create a `.env` file in the workspace root (see `.env.example` for template):

```env
# API Gateway
PORT=8080

# Auth Service
HOST=localhost
PORT=6001

# MongoDB
DATABASE_URL=mongodb://localhost:27017/subkuch
# For MongoDB Atlas:
# DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/database

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=          # Leave empty if no password

# Email (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SERVICE=gmail
SMTP_USER=               # Your Gmail address
SMTP_PASSWORD=           # App password if 2FA enabled
```

**Prerequisites:**
- Node.js 20+
- MongoDB (local or Atlas)
- Redis server (required for OTP functionality)

## Key Features & Architecture

### API Gateway
- **Rate Limiting:** 100 req/15min (unauthenticated), 1000 req/15min (authenticated)
- **CORS:** Configured for `http://localhost:3000` with credentials
- **Reverse Proxy:** All traffic (except `/gateway-health`) → auth-service
- **Logging:** Morgan middleware in dev mode

### Auth Service - OTP Flow
1. **Validation:** Check required fields and email format
2. **User Check:** Query MongoDB for existing user
3. **OTP Restrictions:** Check Redis for locks and cooldowns
4. **Request Tracking:** Enforce 2 requests/hour limit
5. **OTP Generation:** Create 4-digit code (1000-9999)
6. **Email Delivery:** Send via Nodemailer with EJS template
7. **Storage:** Store in Redis with 5-minute expiry

**Redis Keys:**
- `otp:{email}` — OTP value (5min TTL)
- `otp_cooldown:{email}` — 1-minute cooldown
- `otp_request_count:{email}` — Hourly request counter
- `otp_spam_lock:{email}` — 1-hour spam lock
- `otp_lock:{email}` — 30-minute failed attempt lock

## Technology Stack

**Core:**
- Node.js 20+, TypeScript 5.9, Express 4.21, Nx 21.6.5

**Build:**
- Webpack 5 (api-gateway), esbuild 0.19 (auth-service)

**Data:**
- MongoDB (Prisma 6.18), Redis (ioredis 5.8)

**Communication:**
- Nodemailer 7.0, EJS 3.1, axios 1.13, express-http-proxy 2.1

**DevTools:**
- Jest 30, Docker, Swagger

## Agent workflow checklist

- ✅ **Discover first:** Use `nx graph` or `nx show project <name>` before making changes
- ✅ **Use Nx MCP tools:** Leverage `nx_workspace`, `nx_project_details`, `nx_docs` tools for accurate information
- ✅ **Prefer Nx tasks:** Always run tasks via `nx` (not raw tool commands) to benefit from caching
- ✅ **Update documentation:** Modify `docs/CONTEXT.md`, `AGENTS.md`, and `README.md` when adding/changing projects
- ✅ **Validate changes:** Run `npx nx run-many -t typecheck build test` before committing
- ✅ **Environment setup:** Ensure `.env` is configured correctly (never commit it to git)
- ✅ **Clear cache if needed:** Use `npx nx reset` when experiencing stale build issues
- ✅ **Document ports:** Add new service ports to `.env.example` and documentation
- ✅ **Preserve Nx config:** Do not edit the `<!-- nx configuration start/end -->` comment block above
- ✅ **Check dependencies:** MongoDB and Redis must be running for auth-service

## Quick Reference

**Ports:**
- 3000 — Frontend (expected client)
- 6001 — auth-service
- 8080 — api-gateway

**API Endpoints:**
- `GET http://localhost:8080/gateway-health` — Gateway health
- `GET http://localhost:6001/` — Auth service health
- `POST http://localhost:6001/api/user-registration` — OTP registration

**Common Tasks:**
- Start all services: `npm run dev`
- Build everything: `npx nx run-many -t build --all`
- Run tests: `npx nx run-many -t test e2e --all`
- View graph: `npx nx graph`
- Clear cache: `npx nx reset`

## Troubleshooting

**MongoDB Issues:**
- Check `DATABASE_URL` format in `.env`
- Run `npx prisma generate` to regenerate client
- Verify MongoDB is running: `mongosh --eval "db.version()"`

**Redis Issues:**
- Test connection: `redis-cli ping` (should return PONG)
- Check `.env` for correct `REDIS_HOST` and `REDIS_PORT`
- Ensure Redis server is running

**Port Conflicts:**
- Change ports in `.env` file
- Kill process: `netstat -ano | findstr :8080` then `taskkill /PID <PID> /F`

**Email Issues:**
- Use Gmail App Password (not regular password) if 2FA is enabled
- Verify SMTP credentials in `.env`

**Documentation:**
- Full context: `docs/CONTEXT.md`
- README: `README.md`
- Nx docs: https://nx.dev
