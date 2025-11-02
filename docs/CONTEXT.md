# Project Context and Agent Instructions

**Updated:** 2025-11-02

## Overview

Nx 21.6.5 monorepo for an e-commerce platform built with Node.js/TypeScript microservices. The workspace contains:

- **@subkuch.store/api-gateway** — Express API gateway with rate limiting, CORS, and reverse proxy (Webpack build)
- **@subkuch.store/auth-service** — Express authentication service with OTP-based registration (esbuild build)
- **@subkuch.store/auth-service-e2e** — Jest-based end-to-end tests for auth-service
- **Shared Packages** — Reusable error handling, Prisma MongoDB client, Redis client

All projects use Nx for orchestration, caching, and task execution. **Always prefer `nx` commands over raw tool CLIs** to leverage Nx's dependency graph and caching.

**Nx Cloud:** Connected (ID: 68f7b1fa64ec897f6e1d398b) for distributed caching and CI analytics.

---

## Projects Deep Dive

### @subkuch.store/api-gateway

**Purpose:** API gateway providing rate limiting, CORS, logging, and reverse proxy to backend services.

**Details:**
- **Root:** `apps/api-gateway`
- **Build Tool:** Webpack 5 (`webpack-cli build` via `@nx/webpack`)
- **Output:** `dist/apps/api-gateway`
- **Default Port:** 8080 (via `PORT` env variable)

**Available Targets:**
- `typecheck` — TypeScript validation
- `build` — Webpack production build (outputs to `dist/apps/api-gateway`)
- `serve` — Node.js server running built output (depends on build)
- `preview` — Webpack dev server in production mode
- `serve-static` — Serve pre-built static files with file server
- `build-deps`, `watch-deps` — Dependency management
- `prune-lockfile`, `copy-workspace-modules`, `prune` — Deployment optimization

**Endpoints:**
- `GET /gateway-health` — Returns `{ message: "Welcome to api-gateway!" }`
- `GET /` — Proxies all requests to auth-service (`http://localhost:6001`)

**Key Features:**
- **CORS:** Configured for `http://localhost:3000` with credentials support
- **Rate Limiting:** 
  - Unauthenticated: 100 requests per 15 minutes (by IP)
  - Authenticated: 1000 requests per 15 minutes (by API key from query param)
  - Uses `ipKeyGenerator` for safer IP extraction
- **Request Logging:** Morgan middleware in dev mode
- **Body Parsing:** JSON and URL-encoded (100MB limit)
- **Cookie Support:** Cookie parser enabled
- **Proxy:** All non-`/gateway-health` traffic forwarded to auth-service

**Technologies:**
- express 4.21
- express-http-proxy 2.1
- express-rate-limit 8.1
- cors 2.8
- morgan 1.10
- cookie-parser 1.4

**File Structure:**
```
apps/api-gateway/
├── src/
│   ├── main.ts           # Express app with rate limiter and proxy
│   └── assets/           # Static assets
├── webpack.config.js     # Webpack configuration
├── tsconfig.json         # TypeScript config
└── package.json          # Project metadata
```

**Development:**
```powershell
npx nx serve @subkuch.store/api-gateway
# Access at http://localhost:8080
```

---

### @subkuch.store/auth-service

**Purpose:** Authentication microservice handling user registration with OTP verification via email.

**Details:**
- **Root:** `apps/auth-service`
- **Build Tool:** esbuild 0.19 (`@nx/esbuild:esbuild`)
- **Output:** `dist/apps/auth-service`
- **Default Host/Port:** localhost:6001 (via `HOST` and `PORT` env variables)

**Available Targets:**
- `typecheck` — TypeScript validation
- `test` — Jest unit tests (with coverage support)
- `build` — esbuild production build (outputs to `apps/auth-service/dist`)
- `serve` — Node.js server running built output (depends on build)
- `docker:build` — Build Docker image (tag: `apps-auth-service`)
- `docker:run` — Run Docker container
- `nx-release-publish` — Publish Docker image to registry
- `prune-lockfile`, `copy-workspace-modules`, `prune` — Deployment optimization

**Endpoints:**
- `GET /` — Health check, returns `{ message: "Hello API" }`
- `POST /api/user-registration` — Initiates OTP-based user registration

**POST /api/user-registration**

*Request Body:*
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secure_password",
  "phone_number": "+1234567890",  // Required for sellers only
  "country": "US"                  // Required for sellers only
}
```

*Success Response (200):*
```json
{
  "message": "OTP sent to your email. Please verify to complete registration."
}
```

*Error Responses (400):*
- "Missing required fields for registration"
- "Invalid email format"
- "User with this email already exists"
- "Please wait 1 minute before requesting a new OTP" (cooldown)
- "Too many OTP requests. Please try again after 1 hour" (spam protection)
- "Account locked due to multiple failed OTP attempts. Please try again after 30 minutes"

**OTP Flow Implementation:**
1. **Validation** (`validateRegistrationData`)
   - Checks required fields (name, email, password; phone_number & country for sellers)
   - Validates email format with regex
   
2. **User Existence Check**
   - Queries MongoDB via Prisma for existing user by email
   - Returns error if user already exists
   
3. **OTP Restrictions** (`checkOtpRestrictions`)
   - Checks Redis for `otp_lock:{email}` (30min lock after multiple failed attempts)
   - Checks Redis for `otp_spam_lock:{email}` (1hr lock after too many requests)
   - Checks Redis for `otp_cooldown:{email}` (1min between OTP requests)
   
4. **Request Tracking** (`trackOtpRequest`)
   - Increments `otp_request_count:{email}` in Redis
   - Locks account (`otp_spam_lock`) if >= 2 requests in 1 hour
   - Tracking expires after 1 hour
   
5. **OTP Generation & Delivery** (`sendOtp`)
   - Generates 4-digit random OTP (1000-9999)
   - Sends email via Nodemailer using EJS template (`user-activation-mail.ejs`)
   - Stores OTP in Redis: `otp:{email}` (5min TTL)
   - Sets cooldown: `otp_cooldown:{email}` (1min TTL)

**Key Features:**
- **MongoDB Storage:** Prisma ORM for user data (`users` collection)
- **Redis Caching:** OTP storage, rate limiting, cooldowns, spam protection
- **Email Delivery:** Nodemailer 7.0 with EJS templates
- **Error Handling:** Centralized via custom `errorMiddleware`
- **CORS:** Configured for `http://localhost:3000` with credentials
- **Docker Support:** Dockerfile included for containerization
- **API Documentation:** Swagger autogeneration (`swagger.mjs` script)

**Technologies:**
- express 4.21
- @prisma/client 6.18 (MongoDB)
- ioredis 5.8 (Redis client)
- nodemailer 7.0 (Email delivery)
- ejs 3.1 (Email templating)
- swagger-autogen 2.23.7 (API docs)

**File Structure:**
```
apps/auth-service/
├── src/
│   ├── main.ts                              # Express app entry point
│   ├── controller/
│   │   └── auth.controller.ts               # userRegistration handler
│   ├── routes/
│   │   └── auth.router.ts                   # Express router for /api routes
│   ├── utils/
│   │   ├── auth.helper.ts                   # OTP validation & sending logic
│   │   ├── sendMail/
│   │   │   └── index.ts                     # Nodemailer configuration
│   │   └── email-templates/
│   │       └── user-activation-mail.ejs     # OTP email template
│   ├── swagger.mjs                          # Swagger generator script
│   └── swagger-output.json                  # Generated API documentation
├── Dockerfile                               # Docker image config
├── tsconfig.json                            # TypeScript config
└── package.json                             # Project metadata
```

**Development:**
```powershell
npx nx serve @subkuch.store/auth-service
# Access at http://localhost:6001
```

**Docker:**
```powershell
npx nx docker:build @subkuch.store/auth-service
npx nx docker:run @subkuch.store/auth-service -- -p 3000:3000
```

**Generate Swagger Docs:**
```powershell
cd apps/auth-service/src
node swagger.mjs
```

---

### @subkuch.store/auth-service-e2e

**Purpose:** End-to-end testing suite for auth-service.

**Details:**
- **Root:** `apps/auth-service-e2e`
- **Test Runner:** Jest 30 (`@nx/jest:jest`)
- **Dependencies:** Requires `@subkuch.store/auth-service:build` and `:serve`

**Available Targets:**
- `typecheck` — TypeScript validation
- `e2e` — Run end-to-end tests

**Test Setup:**
- `global-setup.ts` — Pre-test initialization
- `global-teardown.ts` — Post-test cleanup
- `test-setup.ts` — Per-test configuration

**File Structure:**
```
apps/auth-service-e2e/
├── src/
│   ├── auth-service/
│   │   └── auth-service.spec.ts    # E2E test cases
│   └── support/
│       ├── global-setup.ts
│       ├── global-teardown.ts
│       └── test-setup.ts
├── jest.config.ts                  # Jest configuration
└── tsconfig.json                   # TypeScript config
```

**Run Tests:**
```powershell
npx nx e2e @subkuch.store/auth-service-e2e
```

---

## Shared Packages

### packages/error-handler

**Purpose:** Centralized error handling system for all services.

**Exports:**

**Error Classes (all extend `AppError`):**
- `AppError(message, statusCode, isOperational, details?)` — Base error class
- `NotFoundError(message?)` — 404 resource not found (default: "Resource not found")
- `ValidationError(message?, details?)` — 400 validation errors (default: "Invalid request data! Validation failed...")
- `AuthError(message?)` — 401 authentication errors (default: "Authentication failed")
- `ForbiddenError(message?)` — 403 authorization errors (default: "Access forbidden")
- `DatabaseError(message?)` — 500 database errors (default: "Database operation failed")
- `RateLimitError(message?)` — 429 rate limit exceeded (default: "Rate limit exceeded")
- `ExternalServiceError(message?)` — 502 external API errors (default: "External service error")
- `TimeoutError(message?)` — 504 request timeout (default: "Request timeout")

**Middleware:**
- `errorMiddleware(err, req, res)` — Express error handler
  - Logs errors to console
  - Returns structured JSON responses
  - Handles both `AppError` instances and generic errors

**Usage Example:**
```typescript
import { ValidationError } from "../../../../packages/error-handler";
import { errorMiddleware } from "../../../../packages/error-handler/error-middleware";

// In controller
if (!email) {
  throw new ValidationError("Email is required");
}

// In main.ts
app.use(errorMiddleware);
```

**File Structure:**
```
packages/error-handler/
├── index.ts              # Error class definitions
└── error-middleware.ts   # Express middleware
```

---

### packages/libs/prisma

**Purpose:** MongoDB ORM client (Prisma) singleton.

**Configuration:**
- **Schema:** `prisma/schema.prisma`
- **Generator Output:** `generated/prisma/` (custom path)
- **Database:** MongoDB (connection string via `DATABASE_URL` env)

**Schema Models:**

**users:**
```prisma
model users {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  name      String
  email     String   @unique
  password  String?
  following String[]
  avatar    images?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**images:**
```prisma
model images {
  id      String  @id @default(auto()) @map("_id") @db.ObjectId
  file_id String
  url     String
  userId  String? @db.ObjectId @unique
  users   users?  @relation(fields: [userId], references: [id])
}
```

**Usage:**
```typescript
import prisma from "../../../../packages/libs/prisma";

const user = await prisma.user.findUnique({ where: { email } });
```

**Singleton Pattern:**
- Prevents duplicate Prisma Client instances
- Caches global instance in production mode

**File Structure:**
```
packages/libs/prisma/
└── index.ts              # Prisma singleton export

generated/prisma/         # Generated Prisma client (custom output path)
├── client.ts
├── models.ts
├── enums.ts
└── models/
    ├── users.ts
    └── images.ts
```

---

### packages/libs/redis

**Purpose:** Redis client (ioredis) singleton.

**Configuration:**
- **Host:** `REDIS_HOST` env (default: `127.0.0.1`)
- **Port:** `REDIS_PORT` env (default: `6379`)
- **Password:** `REDIS_PASSWORD` env (optional)

**Usage in Auth Service:**
- `otp:{email}` — Store OTP (5min TTL)
- `otp_cooldown:{email}` — Prevent rapid requests (1min TTL)
- `otp_request_count:{email}` — Track requests per hour (1hr TTL)
- `otp_spam_lock:{email}` — Spam prevention lock (1hr TTL)
- `otp_lock:{email}` — Failed attempt lock (30min TTL)

**Example:**
```typescript
import redis from "../../../../packages/libs/redis";

await redis.set("otp:user@example.com", "1234", "EX", 300);
const otp = await redis.get("otp:user@example.com");
```

**File Structure:**
```
packages/libs/redis/
└── index.ts              # Redis singleton export
```

---

## Environment Variables

### api-gateway
```env
PORT=8080                 # Server port (default: 8080)
```

### auth-service
```env
# Server
HOST=localhost            # Server host (default: localhost)
PORT=6001                 # Server port (default: 6001)

# MongoDB (Prisma)
DATABASE_URL=mongodb://localhost:27017/subkuch

# Redis
REDIS_HOST=127.0.0.1      # Redis host (default: 127.0.0.1)
REDIS_PORT=6379           # Redis port (default: 6379)
REDIS_PASSWORD=           # Redis password (optional)

# Email (Nodemailer)
SMTP_HOST=smtp.gmail.com  # SMTP server (default: Gmail)
SMTP_PORT=465             # SMTP port (default: 465 for SSL)
SMTP_USER=                # SMTP username
SMTP_PASS=                # SMTP password or app password
```

**Setup:**
Create `.env` file in workspace root with the above variables.

---

## Common Commands (Windows PowerShell)

### Development

**Serve all apps:**
```powershell
npm run dev
```

**Serve individual app:**
```powershell
npx nx serve @subkuch.store/api-gateway
npx nx serve @subkuch.store/auth-service
```

### Build

**Build all:**
```powershell
npx nx run-many -t build --all
```

**Build individual:**
```powershell
npx nx build @subkuch.store/api-gateway
npx nx build @subkuch.store/auth-service
```

**Clean build (skip cache):**
```powershell
npx nx build @subkuch.store/api-gateway --skip-nx-cache
npx nx build @subkuch.store/auth-service --skip-nx-cache
```

### Testing

**Unit tests:**
```powershell
npx nx test @subkuch.store/auth-service
```

**E2E tests:**
```powershell
npx nx e2e @subkuch.store/auth-service-e2e
```

**Typecheck all:**
```powershell
npx nx run-many -t typecheck --all
```

**Run all validations:**
```powershell
npx nx run-many -t typecheck build test --parallel=2
```

### Docker (auth-service)

**Build image:**
```powershell
npx nx docker:build @subkuch.store/auth-service
```

**Run container:**
```powershell
npx nx docker:run @subkuch.store/auth-service -- -p 3000:3000
```

### Nx Utilities

**Visualize dependency graph:**
```powershell
npx nx graph
```

**Show project details:**
```powershell
npx nx show project @subkuch.store/api-gateway
npx nx show project @subkuch.store/auth-service
```

**Clear Nx cache:**
```powershell
npx nx reset
```

### Prisma

**Generate client after schema changes:**
```powershell
npx prisma generate
```

**View database in GUI:**
```powershell
npx prisma studio
```

### Swagger

**Generate API documentation:**
```powershell
cd apps/auth-service/src
node swagger.mjs
```

---

## Architecture Overview

```
┌─────────────────────────────────────┐
│         Client (Browser)            │
│      http://localhost:3000          │
└──────────────┬──────────────────────┘
               │
               │ HTTP Requests
               │
               ▼
┌──────────────────────────────────────┐
│       API Gateway (Port 8080)        │
│  ┌────────────────────────────────┐  │
│  │ Rate Limiter (100-1000 req/15m)│  │
│  │ CORS Handler                   │  │
│  │ Request Logger (morgan)        │  │
│  │ Cookie Parser                  │  │
│  └────────────┬───────────────────┘  │
│               │                      │
│               │ Reverse Proxy        │
│               │                      │
└───────────────┼──────────────────────┘
                │
                ▼
┌──────────────────────────────────────┐
│     Auth Service (Port 6001)         │
│  ┌────────────────────────────────┐  │
│  │ Routes (/api/user-registration)│  │
│  │ Controllers (userRegistration) │  │
│  │ Utilities (OTP, validation)    │  │
│  │ Error Middleware               │  │
│  └────┬──────────────────┬────────┘  │
│       │                  │            │
└───────┼──────────────────┼────────────┘
        │                  │
        ▼                  ▼
┌──────────────┐    ┌──────────────┐
│   MongoDB    │    │    Redis     │
│              │    │              │
│ Collections: │    │ Keys:        │
│ - users      │    │ - otp:*      │
│ - images     │    │ - otp_lock:* │
│              │    │ - otp_spam:* │
└──────────────┘    └──────────────┘
```

**Request Flow Example (User Registration):**
1. Client sends `POST` to `http://localhost:8080/api/user-registration`
2. API Gateway rate limiter checks IP/API key (allows if < 100/1000 per 15min)
3. API Gateway proxies request to `http://localhost:6001/api/user-registration`
4. Auth Service validates request body
5. Auth Service checks MongoDB for existing user
6. Auth Service checks Redis for OTP locks/cooldowns
7. Auth Service generates 4-digit OTP
8. Auth Service sends OTP email via Nodemailer
9. Auth Service stores OTP in Redis (5min expiry)
10. Auth Service returns success response to client

---

## Technology Stack

**Runtime & Language:**
- Node.js 20+
- TypeScript 5.9

**Frameworks:**
- Express 4.21 (web framework)
- Nx 21.6.5 (monorepo orchestration)

**Build Tools:**
- Webpack 5 (api-gateway)
- esbuild 0.19 (auth-service)

**Databases:**
- MongoDB (via Prisma 6.18 ORM)
- Redis (via ioredis 5.8)

**Testing:**
- Jest 30 (unit & e2e tests)

**Email:**
- Nodemailer 7.0
- EJS 3.1 (templating)

**HTTP:**
- axios 1.13 (HTTP client)
- express-http-proxy 2.1 (reverse proxy)
- express-rate-limit 8.1 (rate limiting)
- cors 2.8 (CORS middleware)
- morgan 1.10 (request logging)

**Documentation:**
- swagger-autogen 2.23.7
- swagger-ui-express 5.0

**Containerization:**
- Docker (via @nx/docker plugin)

---

## Development Conventions

### Adding New Services

1. **Create project:**
   ```powershell
   npx nx g @nx/express:app <service-name>
   ```

2. **Add targets:**
   - `build` — esbuild or webpack
   - `serve` — development server
   - `test` — Jest tests
   - `typecheck` — TypeScript validation
   - `docker:build`, `docker:run` — containerization (optional)

3. **Update documentation:**
   - Add project details to `docs/CONTEXT.md`
   - Add quick reference to `AGENTS.md`
   - Update `README.md` if user-facing

4. **Configure ports:**
   - Choose non-conflicting port (document in `.env.example`)
   - Update gateway proxy if needed

### Code Organization

**Express Apps:**
```
apps/<service-name>/
├── src/
│   ├── main.ts              # Entry point
│   ├── routes/              # Express routers
│   ├── controllers/         # Request handlers
│   ├── utils/               # Helper functions
│   └── middleware/          # Custom middleware
├── Dockerfile               # Docker config (optional)
├── tsconfig.json            # TypeScript config
└── package.json             # Project metadata
```

**Shared Packages:**
```
packages/<package-name>/
├── index.ts                 # Main export
└── [feature-files].ts       # Implementation
```

### Naming Conventions

- **Projects:** `@subkuch.store/<name>` (kebab-case)
- **Targets:** `build`, `serve`, `test`, `docker:build` (lowercase)
- **Files:** `auth.controller.ts`, `auth.helper.ts` (kebab-case)
- **Classes:** `ValidationError`, `AppError` (PascalCase)
- **Functions:** `userRegistration`, `sendOtp` (camelCase)
- **Environment Variables:** `REDIS_HOST`, `DATABASE_URL` (SCREAMING_SNAKE_CASE)

### Error Handling

**Always use custom error classes:**
```typescript
import { ValidationError, AuthError } from "packages/error-handler";

if (!email) {
  throw new ValidationError("Email is required");
}

if (!authenticated) {
  throw new AuthError("Invalid credentials");
}
```

**Always add error middleware last:**
```typescript
import { errorMiddleware } from "packages/error-handler/error-middleware";

// ... routes

app.use(errorMiddleware); // MUST be last
```

### Nx Best Practices

- **Always use `nx` commands** to leverage caching and dependency graph
- **Use `--skip-nx-cache`** sparingly (only for debugging)
- **Run `nx graph`** to visualize project dependencies before major changes
- **Use `nx show project <name>`** to discover available targets
- **Run multiple targets** with `nx run-many -t <target1> <target2> --parallel`

---

## Troubleshooting

### MongoDB Connection Issues

**Symptom:** Prisma client fails to connect

**Solutions:**
1. Verify `DATABASE_URL` in `.env`:
   ```env
   # Local MongoDB
   DATABASE_URL=mongodb://localhost:27017/subkuch
   
   # MongoDB Atlas
   DATABASE_URL=mongodb+srv://user:pass@cluster.mongodb.net/database
   ```

2. Regenerate Prisma client:
   ```powershell
   npx prisma generate
   ```

3. Check MongoDB is running:
   ```powershell
   # For local MongoDB
   mongosh --eval "db.version()"
   ```

### Redis Connection Issues

**Symptom:** OTP functionality fails, Redis errors in logs

**Solutions:**
1. Verify Redis is running:
   ```powershell
   redis-cli ping
   # Expected: PONG
   ```

2. Check `.env` configuration:
   ```env
   REDIS_HOST=127.0.0.1
   REDIS_PORT=6379
   REDIS_PASSWORD=          # Leave empty if no password
   ```

3. Start Redis (Windows):
   ```powershell
   # If using Redis for Windows
   redis-server
   ```

### Port Already in Use

**Symptom:** `EADDRINUSE` error when starting services

**Solutions:**
1. Change port in `.env`:
   ```env
   PORT=8081  # api-gateway
   PORT=6002  # auth-service
   ```

2. Kill process using port:
   ```powershell
   # Find process on port 8080
   netstat -ano | findstr :8080
   
   # Kill process by PID
   taskkill /PID <PID> /F
   ```

### TypeScript Errors

**Symptom:** Build fails with TypeScript errors

**Solutions:**
1. Run typecheck to see errors:
   ```powershell
   npx nx run-many -t typecheck --all
   ```

2. Regenerate Prisma types:
   ```powershell
   npx prisma generate
   ```

3. Clear Nx cache and rebuild:
   ```powershell
   npx nx reset
   npx nx build @subkuch.store/auth-service --skip-nx-cache
   ```

### Email Sending Fails

**Symptom:** OTP emails not delivered

**Solutions:**
1. Verify SMTP credentials in `.env`
2. For Gmail, use App Password (not regular password):
   - Go to Google Account → Security → 2-Step Verification → App Passwords
   - Generate password for "Mail"
   - Use generated password in `SMTP_PASS`

3. Check Nodemailer logs in auth-service console

### Nx Cache Issues

**Symptom:** Stale builds, outdated outputs

**Solutions:**
1. Clear Nx cache:
   ```powershell
   npx nx reset
   ```

2. Run without cache:
   ```powershell
   npx nx build @subkuch.store/auth-service --skip-nx-cache
   ```

### Docker Build Fails

**Symptom:** Docker image build errors

**Solutions:**
1. Ensure dependencies are built:
   ```powershell
   npx nx build @subkuch.store/auth-service
   ```

2. Check Dockerfile paths match output directory
3. Rebuild with verbose output:
   ```powershell
   npx nx docker:build @subkuch.store/auth-service --verbose
   ```

---

## Quick Reference

### Project Structure at a Glance

```
subkuch.store/
├── apps/
│   ├── api-gateway/          # API Gateway (Webpack, port 8080)
│   ├── auth-service/         # Auth Service (esbuild, port 6001)
│   └── auth-service-e2e/     # E2E tests for auth-service
├── packages/
│   ├── error-handler/        # Centralized error handling
│   └── libs/
│       ├── prisma/           # MongoDB ORM singleton
│       └── redis/            # Redis client singleton
├── prisma/
│   └── schema.prisma         # Database schema (users, images)
├── generated/prisma/         # Generated Prisma client
├── docs/
│   └── CONTEXT.md           # This file - complete project documentation
├── .env                      # Environment variables (not in git)
├── .env.example              # Environment template
├── AGENTS.md                 # Quick reference for AI agents
├── README.md                 # User-facing documentation
├── nx.json                   # Nx workspace configuration
├── package.json              # Root dependencies and scripts
└── tsconfig.base.json        # Shared TypeScript configuration
```

### Nx Workspace Configuration

**Plugins:**
1. `@nx/js/typescript` — TypeScript compilation and validation
2. `@nx/jest/plugin` — Jest testing (excluding e2e projects)
3. `@nx/docker` — Docker build and run targets
4. `@nx/webpack/plugin` — Webpack build system

**Target Defaults:**
- `@nx/esbuild:esbuild` — Caching enabled, depends on `^build`, uses production inputs
- `test` — Depends on `^build` to ensure dependencies are built first

**Named Inputs:**
- `default` — All project files + shared globals
- `production` — Default minus test files, spec configs, and test setup files
- `sharedGlobals` — CI workflow file (`.github/workflows/ci.yml`)

### Endpoints Summary

**api-gateway (http://localhost:8080):**
- `GET /gateway-health` → Health check
- `GET /` → Proxy to auth-service

**auth-service (http://localhost:6001):**
- `GET /` → Health check
- `POST /api/user-registration` → OTP registration

### Redis Keys Reference

| Key Pattern | Purpose | TTL | Set By |
|-------------|---------|-----|--------|
| `otp:{email}` | Store 4-digit OTP | 5 min (300s) | `sendOtp()` |
| `otp_cooldown:{email}` | Prevent rapid requests | 1 min (60s) | `sendOtp()` |
| `otp_request_count:{email}` | Track hourly requests | 1 hour (3600s) | `trackOtpRequest()` |
| `otp_spam_lock:{email}` | Anti-spam lock (≥2 req/hr) | 1 hour (3600s) | `trackOtpRequest()` |
| `otp_lock:{email}` | Failed verification lock | 30 min (1800s) | Manual (future) |

### Rate Limits

**api-gateway:**
- Unauthenticated: 100 requests per 15 minutes
- Authenticated: 1000 requests per 15 minutes

**auth-service OTP:**
- 1 minute cooldown between requests
- 2 requests maximum per hour (then 1hr lock)

### Ports

- **3000** — Frontend (expected client)
- **6001** — auth-service
- **8080** — api-gateway

---

## Agent Workflow Checklist

When making changes to the workspace:

1. ✅ **Discover first:** Use `nx graph` or `nx show project <name>` to understand current state
2. ✅ **Prefer Nx tasks:** Always run `npx nx <target>` instead of raw tool commands
3. ✅ **Update docs:** Modify `docs/CONTEXT.md`, `AGENTS.md`, and `README.md` when adding/changing projects
4. ✅ **Validate changes:** Run `npx nx run-many -t typecheck build test` before committing
5. ✅ **Clear cache if needed:** Use `npx nx reset` when experiencing stale build issues
6. ✅ **Document ports:** Add new service ports to `.env.example` and this file
7. ✅ **Preserve Nx config:** Do not edit the `<!-- nx configuration start/end -->` block in `AGENTS.md`

---

## Additional Resources

- **Nx Documentation:** https://nx.dev
- **Prisma Documentation:** https://www.prisma.io/docs
- **Express Documentation:** https://expressjs.com
- **Redis Documentation:** https://redis.io/docs
- **Nodemailer Documentation:** https://nodemailer.com

---

*This document is the single source of truth for understanding the SubkuchStore monorepo architecture. Keep it updated as the project evolves.*
